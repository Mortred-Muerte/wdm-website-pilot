(() => {
  'use strict';

  const isFrench = /^fr(?:-|$)/i.test(document.documentElement.lang || '');
  const uiText = isFrench ? {
    sending: 'Envoi en cours…',
    updateSent: 'Votre demande de mise à jour a été envoyée. Nous allons l’examiner et vous recontacter.',
    updateTimeout: 'Le délai d’envoi est dépassé. Nous n’avons pas pu confirmer l’envoi. Veuillez réessayer.',
    updateError: 'Nous n’avons pas pu confirmer l’envoi de votre demande. Veuillez réessayer.',
    required: 'Veuillez remplir ce champ.',
    invalidEmail: 'Veuillez saisir une adresse e-mail valide.',
    invalidWebsite: 'Veuillez saisir une URL complète, par exemple https://votresite.com.',
    invalidLength: 'Veuillez raccourcir ce texte.',
    invalidField: 'Veuillez vérifier ce champ.',
    invalidName: 'Indiquez votre nom en 100 caractères maximum.',
    invalidChanges: 'Décrivez les modifications en 5 000 caractères maximum.',
    briefHeader: 'DEMANDE DE SITE WEB WDM',
    briefName: 'Nom',
    briefBusiness: 'Activité',
    briefEmail: 'E-mail',
    briefService: 'Type de site',
    labelSeparator: ' : ',
    briefProject: 'À propos du projet',
    briefReady: 'Choisissez l’e-mail ou WhatsApp pour envoyer votre demande. Rien n’a encore été envoyé.',
    briefSubject: 'Demande de site web WDM',
    briefCopied: 'Demande copiée. Vous pouvez la coller dans votre message.',
    briefSelect: 'Votre demande est sélectionnée. Utilisez la commande Copier de votre appareil pour la copier.',
    briefFilename: 'wdm-demande-site-web.txt',
    briefDownloaded: 'Demande téléchargée. Rien n’a été envoyé.',
  } : {
    sending: 'Sending…',
    updateSent: 'Your update request has been sent. We’ll review it and get back to you.',
    updateTimeout: 'The request timed out. We couldn’t confirm it was sent. Please try again.',
    updateError: 'We couldn’t confirm your request was sent. Please try again.',
    required: 'Please complete this field.',
    invalidEmail: 'Please enter a valid email address.',
    invalidWebsite: 'Please enter a full http:// or https:// website link.',
    invalidLength: 'Please shorten this text.',
    invalidField: 'Please check this field.',
    invalidName: 'Enter your name using up to 100 characters.',
    invalidChanges: 'Describe the changes using up to 5,000 characters.',
    briefHeader: 'WDM WEBSITE ENQUIRY',
    briefName: 'Name',
    briefBusiness: 'Business',
    briefEmail: 'Email',
    briefService: 'Service',
    labelSeparator: ': ',
    briefProject: 'About the project',
    briefReady: 'Choose email or WhatsApp to send your enquiry. Nothing has been sent yet.',
    briefSubject: 'WDM Website Enquiry',
    briefCopied: 'Enquiry copied. You can paste it into your message.',
    briefSelect: 'Your enquiry is selected. Use your device’s Copy command to copy it.',
    briefFilename: 'wdm-website-enquiry.txt',
    briefDownloaded: 'Enquiry downloaded. Nothing has been sent.',
  };

  const localizeFrenchValidation = (form) => {
    if (!isFrench || !form) return;
    form.addEventListener('invalid', (event) => {
      const control = event.target;
      if (!control || typeof control.setCustomValidity !== 'function' || !control.validity) return;
      if (control.validity.valueMissing) control.setCustomValidity(uiText.required);
      else if (control.validity.typeMismatch && control.type === 'email') control.setCustomValidity(uiText.invalidEmail);
      else if (control.validity.typeMismatch && control.type === 'url') control.setCustomValidity(uiText.invalidWebsite);
      else if (control.validity.tooLong) control.setCustomValidity(uiText.invalidLength);
      else if (!control.validity.customError) control.setCustomValidity(uiText.invalidField);
    }, true);
    const clearValidation = (event) => {
      if (event.target && typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    };
    form.addEventListener('input', clearValidation, true);
    form.addEventListener('change', clearValidation, true);
  };

  const languageSectionIds = new Set(Array.from(document.querySelectorAll('main > section[id]'), (section) => section.id));
  document.querySelectorAll('.language-switch a[data-language-link]').forEach((link) => {
    const rootHref = link.getAttribute('href');
    if (rootHref !== '/' && rootHref !== '/fr/') return;
    link.addEventListener('click', () => {
      let sectionHash = '';
      try {
        const sectionId = decodeURIComponent(window.location.hash.slice(1));
        if (languageSectionIds.has(sectionId)) sectionHash = `#${encodeURIComponent(sectionId)}`;
      } catch {
        // Unknown or malformed fragments fall back to the language page's top.
      }
      link.setAttribute('href', `${rootHref}${sectionHash}`);
    });
  });

  const languageDropdowns = Array.from(document.querySelectorAll('.language-switch details.language-dropdown'));
  if (languageDropdowns.length) {
    languageDropdowns.forEach((dropdown) => {
      dropdown.addEventListener('toggle', () => {
        if (!dropdown.open) return;
        languageDropdowns.forEach((other) => {
          if (other !== dropdown) other.open = false;
        });
      });
      dropdown.querySelectorAll('a[data-language-link]').forEach((link) => {
        link.addEventListener('click', () => { dropdown.open = false; });
      });
    });

    document.addEventListener('click', (event) => {
      languageDropdowns.forEach((dropdown) => {
        if (dropdown.open && !dropdown.contains(event.target)) dropdown.open = false;
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openDropdown = languageDropdowns.find((dropdown) => dropdown.open
        && dropdown.contains(document.activeElement))
        || languageDropdowns.find((dropdown) => dropdown.open);
      if (!openDropdown) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      languageDropdowns.forEach((dropdown) => { dropdown.open = false; });
      const summary = openDropdown.querySelector('summary');
      if (summary) summary.focus();
    });
  }

  const header = document.querySelector('#site-header');
  const menuToggle = document.querySelector('#menu-toggle');
  const navigation = document.querySelector('#primary-nav');

  if (header && menuToggle && navigation) {
    header.classList.add('nav-ready');
    const setMenuOpen = (open) => {
      header.classList.toggle('menu-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    };

    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    navigation.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    if (typeof window.matchMedia === 'function') {
      const desktop = window.matchMedia('(min-width: 880px)');
      const closeAtDesktop = (event) => {
        if (event.matches) setMenuOpen(false);
      };
      closeAtDesktop(desktop);
      if (typeof desktop.addEventListener === 'function') {
        desktop.addEventListener('change', closeAtDesktop);
      } else if (typeof desktop.addListener === 'function') {
        desktop.addListener(closeAtDesktop);
      }
    }
  }

  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  const reducedMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealItems.length && 'IntersectionObserver' in window && !reducedMotion) {
    try {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      revealItems.forEach((item) => observer.observe(item));
      document.documentElement.classList.add('js');
    } catch {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const servicesSection = document.querySelector('#services');
  const servicesHeading = servicesSection && servicesSection.querySelector('.section-heading');
  const servicesRevealItems = servicesSection && servicesSection.querySelectorAll('[data-services-reveal]');
  const servicesMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  if (servicesSection && servicesHeading && servicesRevealItems.length
    && typeof window.IntersectionObserver === 'function'
    && !(servicesMotionQuery && servicesMotionQuery.matches)) {
    let servicesObserver;
    const showServicesImmediately = () => {
      if (servicesObserver) servicesObserver.disconnect();
      servicesSection.classList.remove('services-reveal-ready');
      servicesSection.classList.add('services-revealed');
    };
    const handleServicesMotionChange = (event) => {
      if (!event.matches) return;
      showServicesImmediately();
      if (typeof servicesMotionQuery.removeEventListener === 'function') {
        servicesMotionQuery.removeEventListener('change', handleServicesMotionChange);
      } else if (typeof servicesMotionQuery.removeListener === 'function') {
        servicesMotionQuery.removeListener(handleServicesMotionChange);
      }
    };

    try {
      servicesObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.08)) {
          servicesSection.classList.add('services-revealed');
          servicesObserver.disconnect();
        }
      }, { threshold: 0.08 });
      servicesObserver.observe(servicesHeading);
      servicesSection.classList.add('services-reveal-ready');

      if (servicesMotionQuery) {
        if (typeof servicesMotionQuery.addEventListener === 'function') {
          servicesMotionQuery.addEventListener('change', handleServicesMotionChange);
        } else if (typeof servicesMotionQuery.addListener === 'function') {
          servicesMotionQuery.addListener(handleServicesMotionChange);
        }
        handleServicesMotionChange(servicesMotionQuery);
      }
    } catch {
      showServicesImmediately();
    }
  }

  const managementSection = document.querySelector('#management');
  const managementHeading = managementSection && managementSection.querySelector('.section-heading');
  const managementRevealItems = managementSection && managementSection.querySelectorAll('[data-management-reveal]');
  const managementMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  if (managementSection && managementHeading && managementRevealItems.length
    && typeof window.IntersectionObserver === 'function'
    && !(managementMotionQuery && managementMotionQuery.matches)) {
    let managementObserver;
    const showManagementImmediately = () => {
      if (managementObserver) managementObserver.disconnect();
      managementSection.classList.remove('management-reveal-ready');
      managementSection.classList.add('management-revealed');
    };
    const handleManagementMotionChange = (event) => {
      if (!event.matches) return;
      showManagementImmediately();
      if (typeof managementMotionQuery.removeEventListener === 'function') {
        managementMotionQuery.removeEventListener('change', handleManagementMotionChange);
      } else if (typeof managementMotionQuery.removeListener === 'function') {
        managementMotionQuery.removeListener(handleManagementMotionChange);
      }
    };

    try {
      managementObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.08)) {
          managementSection.classList.add('management-revealed');
          managementObserver.disconnect();
        }
      }, { threshold: 0.08 });
      managementObserver.observe(managementHeading);
      managementSection.classList.add('management-reveal-ready');

      if (managementMotionQuery) {
        if (typeof managementMotionQuery.addEventListener === 'function') {
          managementMotionQuery.addEventListener('change', handleManagementMotionChange);
        } else if (typeof managementMotionQuery.addListener === 'function') {
          managementMotionQuery.addListener(handleManagementMotionChange);
        }
        handleManagementMotionChange(managementMotionQuery);
      }
    } catch {
      showManagementImmediately();
    }
  }

  const stagedSections = document.querySelectorAll('[data-staged-section]');
  const stagedMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  if (typeof window.IntersectionObserver === 'function'
    && !(stagedMotionQuery && stagedMotionQuery.matches)) {
    stagedSections.forEach((section) => {
      const targets = section.querySelectorAll('[data-staged-reveal]');
      const trigger = section.querySelector('[data-staged-trigger]') || targets[0];
      if (!targets.length || !trigger) return;
      let stagedObserver;
      const showStagedSectionImmediately = () => {
        if (stagedObserver) stagedObserver.disconnect();
        section.classList.remove('staged-reveal-ready');
        section.classList.add('staged-revealed');
      };
      const handleStagedMotionChange = (event) => {
        if (!event.matches) return;
        showStagedSectionImmediately();
        if (typeof stagedMotionQuery.removeEventListener === 'function') {
          stagedMotionQuery.removeEventListener('change', handleStagedMotionChange);
        } else if (typeof stagedMotionQuery.removeListener === 'function') {
          stagedMotionQuery.removeListener(handleStagedMotionChange);
        }
      };

      try {
        stagedObserver = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.08)) {
            section.classList.add('staged-revealed');
            stagedObserver.disconnect();
          }
        }, { threshold: 0.08 });
        stagedObserver.observe(trigger);
        section.classList.add('staged-reveal-ready');

        if (stagedMotionQuery) {
          if (typeof stagedMotionQuery.addEventListener === 'function') {
            stagedMotionQuery.addEventListener('change', handleStagedMotionChange);
          } else if (typeof stagedMotionQuery.addListener === 'function') {
            stagedMotionQuery.addListener(handleStagedMotionChange);
          }
          handleStagedMotionChange(stagedMotionQuery);
        }
      } catch {
        showStagedSectionImmediately();
      }
    });
  }

  const founderPortrait = document.querySelector('#founder-portrait');
  const founderPhoto = document.querySelector('#founder-photo');
  if (founderPortrait && founderPhoto) {
    const showFounderPhoto = () => {
      founderPortrait.classList.add('has-founder-photo');
      founderPhoto.removeAttribute('aria-hidden');
    };
    const showFounderFallback = () => {
      founderPortrait.classList.remove('has-founder-photo');
      founderPhoto.setAttribute('aria-hidden', 'true');
    };
    founderPhoto.addEventListener('load', showFounderPhoto);
    founderPhoto.addEventListener('error', showFounderFallback);
    if (founderPhoto.complete) {
      if (founderPhoto.naturalWidth > 0) showFounderPhoto();
      else showFounderFallback();
    }
  }

  const updateRequestOpen = document.querySelector('#update-request-open');
  const updateRequestDialog = document.querySelector('#update-request-dialog');
  const updateRequestClose = document.querySelector('#update-request-close');
  const updateRequestForm = document.querySelector('#update-request-form');
  const updateRequestStatus = document.querySelector('#update-request-status');
  localizeFrenchValidation(updateRequestForm);

  if (updateRequestOpen && updateRequestDialog && updateRequestClose
    && updateRequestForm && updateRequestStatus) {
    let updateRequestIsOpen = false;
    let updateRequestUsesFallback = false;

    const finishUpdateRequestClose = () => {
      if (!updateRequestIsOpen) return;
      updateRequestIsOpen = false;
      updateRequestUsesFallback = false;
      document.body.classList.remove('update-request-open');
      updateRequestOpen.focus();
    };
    const closeUpdateRequest = () => {
      if (!updateRequestIsOpen) return;
      try {
        if (!updateRequestUsesFallback && typeof updateRequestDialog.close === 'function') {
          updateRequestDialog.close();
        } else {
          updateRequestDialog.removeAttribute('open');
        }
      } catch {
        updateRequestDialog.removeAttribute('open');
      }
      finishUpdateRequestClose();
    };

    updateRequestOpen.addEventListener('click', (event) => {
      event.preventDefault();
      if (updateRequestIsOpen) return;
      updateRequestStatus.textContent = '';
      updateRequestUsesFallback = false;

      try {
        if (typeof updateRequestDialog.showModal !== 'function') {
          throw new Error('Native dialog is unavailable');
        }
        updateRequestDialog.showModal();
      } catch {
        updateRequestUsesFallback = true;
        updateRequestDialog.setAttribute('open', '');
        updateRequestDialog.setAttribute('role', 'dialog');
        updateRequestDialog.setAttribute('aria-modal', 'true');
      }

      updateRequestIsOpen = true;
      document.body.classList.add('update-request-open');
      const nameInput = updateRequestDialog.querySelector('#update-name');
      if (nameInput) nameInput.focus();
    });

    updateRequestClose.addEventListener('click', (event) => {
      event.preventDefault();
      closeUpdateRequest();
    });
    updateRequestDialog.addEventListener('close', finishUpdateRequestClose);
    updateRequestDialog.addEventListener('click', (event) => {
      if (event.target !== updateRequestDialog) return;
      const bounds = updateRequestDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) {
        closeUpdateRequest();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!updateRequestIsOpen || !updateRequestUsesFallback) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeUpdateRequest();
      } else if (event.key === 'Tab') {
        const focusable = Array.from(updateRequestDialog.querySelectorAll(
          'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        )).filter((element) => !element.hidden && element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) return;
        if (event.shiftKey && (document.activeElement === first
          || !updateRequestDialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last
          || !updateRequestDialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    let updateRequestSubmitting = false;
    let updateInvalidControl = null;
    let updateFieldError = null;
    let updateValidationShown = false;
    const updateControls = ['name', 'email', 'website', 'updateType', 'changes']
      .map((name) => updateRequestForm.elements.namedItem(name)).filter(Boolean);
    const updateWebsite = updateRequestForm.elements.namedItem('website');

    const clearUpdateFieldError = () => {
      if (updateInvalidControl) {
        updateInvalidControl.removeAttribute('aria-invalid');
        const descriptions = (updateInvalidControl.getAttribute('aria-describedby') || '')
          .split(/\s+/).filter((id) => id && id !== 'update-request-field-error');
        if (descriptions.length) updateInvalidControl.setAttribute('aria-describedby', descriptions.join(' '));
        else updateInvalidControl.removeAttribute('aria-describedby');
      }
      if (updateFieldError) updateFieldError.remove();
      updateInvalidControl = null;
      updateFieldError = null;
    };
    const focusUpdateTarget = (target, block) => {
      try { target.focus({ preventScroll: true }); } catch { target.focus(); }
      if (typeof target.scrollIntoView === 'function') {
        try { target.scrollIntoView({ block, behavior: 'auto' }); }
        catch { target.scrollIntoView(false); }
      }
    };
    const showUpdateResult = (message) => {
      updateValidationShown = false;
      updateRequestStatus.textContent = message;
      updateRequestStatus.setAttribute('tabindex', '-1');
      focusUpdateTarget(updateRequestStatus, 'nearest');
    };
    const updateFieldMessage = (control, serverMessage) => {
      if (control.required && !control.value.trim()) return uiText.required;
      if (!isFrench && typeof serverMessage === 'string') return serverMessage;
      if (control.name === 'website') return uiText.invalidWebsite;
      if (control.name === 'email') return uiText.invalidEmail;
      if (control.name === 'name' && serverMessage) return uiText.invalidName;
      if (control.name === 'changes' && serverMessage) return uiText.invalidChanges;
      if (control.validity.tooLong) return uiText.invalidLength;
      return uiText.invalidField;
    };
    const showUpdateFieldError = (control, message) => {
      clearUpdateFieldError();
      control.setCustomValidity(message);
      control.setAttribute('aria-invalid', 'true');
      updateInvalidControl = control;
      updateFieldError = document.createElement('p');
      updateFieldError.id = 'update-request-field-error';
      updateFieldError.className = 'update-request-field-error';
      updateFieldError.setAttribute('role', 'alert');
      updateFieldError.textContent = message;
      control.insertAdjacentElement('afterend', updateFieldError);
      const descriptions = (control.getAttribute('aria-describedby') || '').trim();
      control.setAttribute('aria-describedby', `${descriptions}${descriptions ? ' ' : ''}update-request-field-error`);
      const label = updateRequestForm.querySelector(`label[for="${control.id}"]`);
      updateRequestStatus.textContent = `${label ? label.textContent.trim() + uiText.labelSeparator : ''}${message}`;
      updateValidationShown = true;
      focusUpdateTarget(control, 'center');
    };
    const normalizeUpdateWebsite = () => {
      if (!updateWebsite) return;
      const value = updateWebsite.value.trim();
      updateWebsite.value = value;
      if (!value || /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /[\\\x00-\x20\x7f]/.test(value)) return;
      try {
        const url = new URL(value.startsWith('//') ? `https:${value}` : `https://${value}`);
        const labels = url.hostname.split('.');
        const validDomain = url.hostname.length <= 253 && labels.length > 1
          && labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
          && /[a-z]/i.test(labels[labels.length - 1]);
        if (validDomain && !url.username && !url.password && (!url.port || Number(url.port) > 0)) {
          updateWebsite.value = url.href;
        }
      } catch { /* Leave invalid input visible for the field-level validation message. */ }
    };
    const validateUpdateFields = () => {
      clearUpdateFieldError();
      updateControls.forEach((control) => {
        control.setCustomValidity('');
        control.value = control.value.trim();
      });
      normalizeUpdateWebsite();
      if (updateWebsite && updateWebsite.value) {
        try {
          const url = new URL(updateWebsite.value);
          if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password
            || /[\\\x00-\x20\x7f]/.test(updateWebsite.value)) throw new Error('Invalid website link');
        } catch { updateWebsite.setCustomValidity(uiText.invalidWebsite); }
      }
      const invalid = updateControls.find((control) => !control.validity.valid);
      if (invalid) {
        showUpdateFieldError(invalid, updateFieldMessage(invalid));
        return false;
      }
      return true;
    };
    const clearEditedUpdateError = (event) => {
      const control = event.target;
      if (!updateControls.includes(control)) return;
      control.setCustomValidity('');
      if (control === updateInvalidControl) clearUpdateFieldError();
      if (updateValidationShown) {
        updateRequestStatus.textContent = '';
        updateValidationShown = false;
      }
    };
    updateRequestForm.addEventListener('input', clearEditedUpdateError);
    updateRequestForm.addEventListener('change', clearEditedUpdateError);

    updateRequestForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (updateRequestSubmitting) return;
      if (!validateUpdateFields()) return;

      const submitButton = updateRequestForm.querySelector('.update-request-submit');
      if (!submitButton) return;
      const fields = new FormData(updateRequestForm);
      const fieldValue = (name) => String(fields.get(name) || '').trim();
      const payload = {
        name: fieldValue('name'),
        email: fieldValue('email'),
        website: fieldValue('website'),
        updateType: fieldValue('updateType'),
        changes: fieldValue('changes'),
        websiteConfirm: fieldValue('websiteConfirm'),
      };
      const originalButtonMarkup = submitButton.innerHTML;
      const originalButtonDisabled = submitButton.disabled;
      let controller;
      let timeout;

      const activeControl = document.activeElement;
      if (activeControl && updateRequestForm.contains(activeControl)
        && /^(INPUT|SELECT|TEXTAREA)$/.test(activeControl.tagName)) activeControl.blur();
      updateValidationShown = false;
      updateRequestSubmitting = true;
      submitButton.disabled = true;
      submitButton.textContent = uiText.sending;
      updateRequestStatus.textContent = uiText.sending;

      try {
        controller = new AbortController();
        timeout = window.setTimeout(() => controller.abort(), 15000);
        const response = await fetch('/api/update-request.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error('Invalid server response');
        }
        if (!response.ok || !result || result.success !== true) {
          if (response.status === 422 && result && result.errors && typeof result.errors === 'object') {
            const invalid = updateControls.find((control) => Object.prototype.hasOwnProperty.call(result.errors, control.name));
            if (invalid) {
              showUpdateFieldError(invalid, updateFieldMessage(invalid, result.errors[invalid.name]));
              return;
            }
          }
          throw new Error('Request was not confirmed');
        }
        showUpdateResult(uiText.updateSent);
      } catch {
        showUpdateResult(controller && controller.signal.aborted
          ? uiText.updateTimeout
          : uiText.updateError);
      } finally {
        window.clearTimeout(timeout);
        updateRequestSubmitting = false;
        submitButton.disabled = originalButtonDisabled;
        submitButton.innerHTML = originalButtonMarkup;
      }
    });
    // Let this bound handler explain invalid fields instead of a silent native block.
    // The HTML keeps native validation when JavaScript is unavailable.
    updateRequestForm.noValidate = true;
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const projectForm = document.querySelector('#project-form');
  localizeFrenchValidation(projectForm);
  const briefResult = document.querySelector('#brief-result');
  const briefOutput = document.querySelector('#brief-output');
  const briefStatus = document.querySelector('#brief-status');
  const emailBrief = document.querySelector('#email-brief');
  const whatsappBrief = document.querySelector('#whatsapp-brief');
  const copyBrief = document.querySelector('#copy-brief');
  const downloadBrief = document.querySelector('#download-brief');

  if (!projectForm || !briefResult || !briefOutput) return;

  const field = (name) => projectForm.elements.namedItem(name);
  const value = (name) => {
    const control = field(name);
    return control && typeof control.value === 'string' ? control.value.trim() : '';
  };
  const selectedLabel = (name) => {
    const control = field(name);
    if (!control || !value(name)) return '';
    if (control.selectedOptions && control.selectedOptions.length) {
      return control.selectedOptions[0].textContent.trim();
    }
    return value(name);
  };
  const announce = (message) => {
    if (briefStatus) briefStatus.textContent = message;
  };

  ['firstName', 'lastName', 'email', 'service'].forEach((name) => {
    const control = field(name);
    if (control && typeof control.setCustomValidity === 'function') {
      control.addEventListener('input', () => control.setCustomValidity(''));
      control.addEventListener('change', () => control.setCustomValidity(''));
    }
  });

  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();

    ['firstName', 'lastName', 'email', 'service'].forEach((name) => {
      const control = field(name);
      if (control && typeof control.setCustomValidity === 'function') {
        control.setCustomValidity(value(name) ? '' : uiText.required);
      }
    });

    if (!projectForm.reportValidity()) return;

    const brief = [
      uiText.briefHeader,
      '',
      `${uiText.briefName}${uiText.labelSeparator}${value('firstName')} ${value('lastName')}`,
      ...(value('business') ? [`${uiText.briefBusiness}${uiText.labelSeparator}${value('business')}`] : []),
      `${uiText.briefEmail}${uiText.labelSeparator}${value('email')}`,
      `${uiText.briefService}${uiText.labelSeparator}${selectedLabel('service')}`,
      ...(value('details') ? ['', uiText.briefProject, value('details')] : []),
    ].join('\n');

    briefOutput.value = brief;
    briefResult.hidden = false;
    announce(uiText.briefReady);

    if (emailBrief) {
      const contactEmail = (projectForm.dataset.contactEmail || '').trim();
      const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
      emailBrief.hidden = !validContact;
      if (validContact) {
        emailBrief.href = `mailto:${contactEmail}?subject=${encodeURIComponent(uiText.briefSubject)}&body=${encodeURIComponent(brief)}`;
      } else {
        emailBrief.removeAttribute('href');
      }
    }

    if (whatsappBrief) {
      const whatsappNumber = (projectForm.dataset.whatsapp || '').replace(/\D/g, '');
      const validNumber = /^[1-9]\d{6,14}$/.test(whatsappNumber);
      whatsappBrief.hidden = !validNumber;
      if (validNumber) {
        whatsappBrief.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(brief)}`;
      } else {
        whatsappBrief.removeAttribute('href');
      }
    }

    const resultHeading = briefResult.querySelector('h3');
    if (resultHeading) {
      resultHeading.setAttribute('tabindex', '-1');
      resultHeading.focus();
    }
  });

  if (copyBrief) {
    copyBrief.addEventListener('click', async () => {
      if (!briefOutput.value) return;
      try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
          throw new Error('Clipboard is unavailable');
        }
        await navigator.clipboard.writeText(briefOutput.value);
        announce(uiText.briefCopied);
      } catch {
        briefOutput.focus();
        briefOutput.select();
        announce(uiText.briefSelect);
      }
    });
  }

  if (downloadBrief) {
    downloadBrief.addEventListener('click', () => {
      if (!briefOutput.value) return;
      const objectUrl = URL.createObjectURL(new Blob([briefOutput.value], {
        type: 'text/plain;charset=utf-8',
      }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = uiText.briefFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      announce(uiText.briefDownloaded);
    });
  }
})();

