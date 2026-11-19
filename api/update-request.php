<?php
declare(strict_types=1);

// Same-origin contact endpoint. No visitor data is used as a recipient or sender.
@ini_set('display_errors', '0');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function wdm_reply(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function wdm_unavailable(): void
{
    wdm_reply(503, ['success' => false, 'message' => 'Your request could not be sent right now. Please try again shortly.']);
}

// The containing directory is private; additionally reject symlinks/non-regular files.
function wdm_private_file(string $path)
{
    if (is_link($path)) return false;
    $previousMask = umask(0077);
    $handle = @fopen($path, 'c+b');
    umask($previousMask);
    if ($handle === false) return false;
    $stat = @fstat($handle);
    if (!$stat || ($stat['mode'] & 0170000) !== 0100000 || !@chmod($path, 0600)) {
        fclose($handle);
        return false;
    }
    return $handle;
}

function wdm_rate_directory(): ?string
{
    $base = realpath(sys_get_temp_dir());
    $documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__));
    if ($base === false || ($documentRoot !== false
        && ($base === $documentRoot || strpos($base, $documentRoot . DIRECTORY_SEPARATOR) === 0))) return null;
    $directory = $base . DIRECTORY_SEPARATOR . 'wdm-update-' . substr(hash('sha256', __DIR__), 0, 24);
    if (is_link($directory)) return null;
    if (!is_dir($directory) && !@mkdir($directory, 0700)) return null;
    $stat = @lstat($directory);
    $expectedOwner = function_exists('posix_geteuid') ? posix_geteuid() : getmyuid();
    if (!$stat || ($stat['mode'] & 0170000) !== 0040000
        || ($stat['mode'] & 0077) !== 0 || $stat['uid'] !== $expectedOwner) return null;
    return $directory;
}

function wdm_rate_key(string $directory): ?string
{
    $handle = wdm_private_file($directory . DIRECTORY_SEPARATOR . 'key');
    if ($handle === false) return null;
    try {
        if (!@flock($handle, LOCK_EX)) return null;
        $stat = @fstat($handle);
        if (!$stat) return null;
        if ($stat['size'] === 0) {
            $key = random_bytes(32);
            if (@fwrite($handle, $key) !== 32 || !@fflush($handle)) return null;
            return $key;
        }
        if ($stat['size'] !== 32 || !@rewind($handle)) return null;
        $key = @fread($handle, 32);
        return is_string($key) && strlen($key) === 32 ? $key : null;
    } finally {
        @flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function wdm_cleanup_rates(string $directory, string $currentPath, int $now): void
{
    // Bounded maintenance: delete only stale, unlocked, hashed-IP records.
    $scan = @opendir($directory);
    if ($scan === false) return;
    $checked = 0;
    while (($entry = readdir($scan)) !== false && $checked < 500) {
        if (!preg_match('/^[a-f0-9]{64}\.json$/D', $entry)) continue;
        $checked++;
        $path = $directory . DIRECTORY_SEPARATOR . $entry;
        if ($path === $currentPath || is_link($path)) continue;
        $modified = @filemtime($path);
        if ($modified === false || $modified >= $now - 172800) continue;
        $handle = @fopen($path, 'r+b');
        if ($handle === false) continue;
        if (@flock($handle, LOCK_EX | LOCK_NB)) {
            $stat = @fstat($handle);
            if ($stat && ($stat['mode'] & 0170000) === 0100000 && $stat['mtime'] < $now - 172800) @unlink($path);
            @flock($handle, LOCK_UN);
        }
        fclose($handle);
    }
    closedir($scan);
}

// -1 = storage failure; 0 = accepted; positive value = Retry-After seconds.
function wdm_rate_limit(): int
{
    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $binaryAddress = is_string($remoteAddress) ? @inet_pton($remoteAddress) : false;
    if ($binaryAddress === false) return -1;
    $directory = wdm_rate_directory();
    if ($directory === null) return -1;
    $key = wdm_rate_key($directory);
    if ($key === null) return -1;
    // HMAC prevents the stored filenames from being a plain dictionary of IP hashes.
    $path = $directory . DIRECTORY_SEPARATOR . hash_hmac('sha256', $binaryAddress, $key) . '.json';
    $handle = wdm_private_file($path);
    if ($handle === false) return -1;
    $now = time();
    try {
        if (!@flock($handle, LOCK_EX) || !@rewind($handle)) return -1;
        $stat = @fstat($handle);
        if (!$stat || $stat['size'] > 8192) return -1;
        $stored = @stream_get_contents($handle, 8193);
        if ($stored === false) return -1;
        $attempts = $stored === '' ? [] : json_decode($stored, true);
        if (!is_array($attempts) || count($attempts) > 20) return -1;
        foreach ($attempts as $attempt) {
            if (!is_int($attempt) || $attempt < 0 || $attempt > $now + 60) return -1;
        }
        $attempts = array_values(array_filter($attempts, static function ($attempt) use ($now) { return $attempt > $now - 86400; }));
        sort($attempts, SORT_NUMERIC);
        $recent = array_values(array_filter($attempts, static function ($attempt) use ($now) { return $attempt > $now - 900; }));
        $retry = 0;
        if (count($recent) >= 5) $retry = max($retry, $recent[0] + 900 - $now);
        if (count($attempts) >= 20) $retry = max($retry, $attempts[0] + 86400 - $now);
        if ($retry > 0) return $retry;
        $attempts[] = $now;
        $encoded = json_encode($attempts);
        if (!is_string($encoded) || !@rewind($handle) || !@ftruncate($handle, 0)
            || @fwrite($handle, $encoded) !== strlen($encoded) || !@fflush($handle)) return -1;
    } finally {
        @flock($handle, LOCK_UN);
        fclose($handle);
    }
    wdm_cleanup_rates($directory, $path, $now);
    return 0;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        wdm_reply(405, ['success' => false, 'message' => 'Use POST to submit an update request.']);
    }
    if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== 'https://jeweled-darkturquoise-horse-69.hostingersite.com') {
        wdm_reply(403, ['success' => false, 'message' => 'This request is not allowed.']);
    }
    $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') {
        wdm_reply(415, ['success' => false, 'message' => 'Submit the request as JSON.']);
    }
    $bodyLimit = 32768;
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? null;
    if ($contentLength !== null && (!ctype_digit((string) $contentLength) || (float) $contentLength > $bodyLimit)) {
        wdm_reply(413, ['success' => false, 'message' => 'This request is too large.']);
    }
    $rawBody = @file_get_contents('php://input', false, null, 0, $bodyLimit + 1);
    if ($rawBody === false) wdm_unavailable();
    if (strlen($rawBody) > $bodyLimit) wdm_reply(413, ['success' => false, 'message' => 'This request is too large.']);
    $data = json_decode($rawBody);
    if (!$data instanceof stdClass || json_last_error() !== JSON_ERROR_NONE) {
        wdm_reply(400, ['success' => false, 'message' => 'The request could not be read. Please try again.']);
    }
    $fields = ['name', 'email', 'website', 'updateType', 'changes'];
    $values = [];
    $errors = [];
    foreach ($fields as $field) {
        if (!isset($data->$field) || !is_string($data->$field)) $errors[$field] = 'Enter a valid value.';
        else $values[$field] = trim($data->$field);
    }
    if (isset($data->websiteConfirm) && !is_string($data->websiteConfirm)) $errors['websiteConfirm'] = 'Invalid value.';
    if (isset($data->websiteConfirm) && is_string($data->websiteConfirm) && trim($data->websiteConfirm) !== '') {
        wdm_reply(400, ['success' => false, 'message' => 'This request could not be sent. Please refresh the page and try again.']);
    }
    if (!$errors) {
        if ($values['name'] === '' || preg_match('/[\x00-\x1F\x7F]/', $values['name']) || preg_match_all('/./us', $values['name']) > 100) $errors['name'] = 'Enter your name using up to 100 characters.';
        if (strlen($values['email']) > 254 || preg_match('/[\x00-\x20\x7F]/', $values['email']) || !filter_var($values['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Enter a valid email address.';
        $url = @parse_url($values['website']);
        if (strlen($values['website']) > 2048 || !filter_var($values['website'], FILTER_VALIDATE_URL)
            || !is_array($url) || !isset($url['scheme'], $url['host']) || !in_array(strtolower($url['scheme']), ['http', 'https'], true)
            || isset($url['user']) || isset($url['pass']) || preg_match('/[\x00-\x20\x7F]/', $values['website'])) $errors['website'] = 'Enter a full http:// or https:// website link.';
        $types = ['content' => 'Content Update', 'website' => 'Website Change', 'business-store' => 'Business / Store Update'];
        if (!isset($types[$values['updateType']])) $errors['updateType'] = 'Choose an update type.';
        $values['changes'] = str_replace(["\r\n", "\r"], "\n", $values['changes']);
        if ($values['changes'] === '' || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $values['changes'])
            || preg_match_all('/./us', $values['changes']) > 5000) $errors['changes'] = 'Describe the changes using up to 5,000 characters.';
    }
    if ($errors) wdm_reply(422, ['success' => false, 'message' => 'Please check the form details and try again.', 'errors' => $errors]);
    if (!is_callable('mail')) wdm_unavailable();
    $retry = wdm_rate_limit();
    if ($retry < 0) wdm_unavailable();
    if ($retry > 0) {
        header('Retry-After: ' . $retry);
        wdm_reply(429, ['success' => false, 'message' => 'Too many requests. Please try again later.']);
    }
    $message = "Website Update Request\r\n\r\nName: " . $values['name']
        . "\r\nEmail: " . $values['email'] . "\r\nWebsite: " . $values['website']
        . "\r\nType of update: " . $types[$values['updateType']]
        . "\r\n\r\nRequested changes:\r\n" . str_replace("\n", "\r\n", $values['changes']);
    $headers = "From: WDM <contact@wdm-design.com>\r\nReply-To: " . $values['email']
        . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: quoted-printable";
    if (!@mail('contact@wdm-design.com', 'Website Update Request', quoted_printable_encode($message), $headers, '-fcontact@wdm-design.com')) wdm_unavailable();
    wdm_reply(200, ['success' => true]);
} catch (Throwable $error) {
    wdm_unavailable();
}
