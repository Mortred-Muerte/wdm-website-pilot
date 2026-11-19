(() => {
  'use strict';

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

  const updateRequestOpen = document.querySelector('#update-request-open');
  const updateRequestDialog = document.querySelector('#update-request-dialog');
  const updateRequestClose = document.querySelector('#update-request-close');
  const updateRequestForm = document.querySelector('#update-request-form');
  const updateRequestStatus = document.querySelector('#update-request-status');

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

    updateRequestForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!updateRequestForm.reportValidity()) return;
      updateRequestStatus.textContent = 'Preview complete. Nothing has been sent.';
    });
  }

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const projectForm = document.querySelector('#project-form');
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
        control.setCustomValidity(value(name) ? '' : 'Please complete this field.');
      }
    });

    if (!projectForm.reportValidity()) return;

    const brief = [
      'WDM WEBSITE ENQUIRY',
      '',
      `Name: ${value('firstName')} ${value('lastName')}`,
      ...(value('business') ? [`Business: ${value('business')}`] : []),
      `Email: ${value('email')}`,
      `Service: ${selectedLabel('service')}`,
      ...(value('details') ? ['', 'About the project', value('details')] : []),
    ].join('\n');

    briefOutput.value = brief;
    briefResult.hidden = false;
    announce('Choose email or WhatsApp to send your enquiry. Nothing has been sent yet.');

    if (emailBrief) {
      const contactEmail = (projectForm.dataset.contactEmail || '').trim();
      const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
      emailBrief.hidden = !validContact;
      if (validContact) {
        emailBrief.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent('New website project enquiry')}&body=${encodeURIComponent(brief)}`;
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
        announce('Enquiry copied. You can paste it into your message.');
      } catch {
        briefOutput.focus();
        briefOutput.select();
        announce('Your enquiry is selected. Use your device’s Copy command to copy it.');
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
      link.download = 'wdm-website-enquiry.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      announce('Enquiry downloaded. Nothing has been sent.');
    });
  }
})();
