/**
 * ADAB SIBER: ISLAMIC DIGITAL ADAB PROTOCOL
 * Core Game Engine, 3D Canvas, Web Audio Synthesizer, & Interactive Modules
 * STRICT POLICY: ZERO UNICODE EMOJIS (Pure SVG / Text Badges only)
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API - 100% Offline, Zero Assets)
  // ==========================================================================
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.12) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio synthesis non-critical issue:', e);
      }
    }

    click() {
      this.playTone(800, 'sine', 0.04, 0.08);
    }

    stageChange() {
      this.playTone(520, 'triangle', 0.08, 0.1);
      setTimeout(() => this.playTone(780, 'sine', 0.1, 0.12), 60);
    }

    correct() {
      this.playTone(523.25, 'triangle', 0.1, 0.15); // C5
      setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.18), 90); // E5
      setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.2), 180); // G5
    }

    wrong() {
      this.playTone(220, 'sawtooth', 0.15, 0.15);
      setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.18), 120);
    }

    fanfare() {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.2), idx * 110);
      });
    }
  }

  const sfx = new SoundFX();

  // ==========================================================================
  // 2. STAGE NAVIGATION & GAME STATE MACHINE
  // ==========================================================================
  const STAGES = [
    { id: 'stage-intro', name: '00 INTRO', title: 'Halaman Utama & Anggota Tim' },
    { id: 'stage-materi', name: '01 MATERI', title: 'Permasalahan & 5 Pilar Adab' },
    { id: 'stage-dalil', name: '02 DALIL', title: 'QS. Al-Hujurat 6 & 12 + Murottal' },
    { id: 'stage-simulator', name: '03 VIDEO LAB', title: 'Lab Respons 3 Video Kasus Nyata' },
    { id: 'stage-kasus', name: '04 KASUS', title: 'Analisis Kasus Viral & Fiqih' },
    { id: 'stage-kuis', name: '05 KUIS', title: 'Arena Uji Pemahaman & Skor' },
    { id: 'stage-refleksi', name: '06 REFLEKSI', title: 'Refleksi Diri, Kesimpulan & Doa' }
  ];

  let currentStageIndex = 0;

  function setStage(index) {
    if (index < 0 || index >= STAGES.length) return;

    currentStageIndex = index;
    sfx.stageChange();

    // Update active class on stage cards
    const stageCards = document.querySelectorAll('.stage-card');
    stageCards.forEach((card, idx) => {
      if (idx === currentStageIndex) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        card.classList.remove('active');
      }
    });

    // Update Stage selector strip buttons
    const stageBtns = document.querySelectorAll('.btn-stage-slot');
    stageBtns.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === currentStageIndex);
    });

    // Update D-Pad Buttons
    const prevBtn = document.getElementById('btn-prev-stage');
    const nextBtn = document.getElementById('btn-next-stage');
    if (prevBtn) prevBtn.disabled = currentStageIndex === 0;
    if (nextBtn) nextBtn.disabled = currentStageIndex === STAGES.length - 1;

    // Update Top Tracker
    const trackerBar = document.getElementById('hud-progress-bar');
    const trackerVal = document.getElementById('hud-progress-val');
    const trackerTitle = document.getElementById('hud-stage-name');
    const pct = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

    if (trackerBar) trackerBar.style.width = pct + '%';
    if (trackerVal) trackerVal.textContent = pct + '%';
    if (trackerTitle) trackerTitle.textContent = STAGES[currentStageIndex].name;
  }

  // ==========================================================================
  // 3. ISLAMIC AUDIO PLAYER CONTROLLER (Local & Global Sync)
  // ==========================================================================
  class AudioEngine {
    constructor() {
      this.currentPlaying = null;
      this.audioElements = {
        hujurat6: document.getElementById('audio-hujurat-6'),
        hujurat12: document.getElementById('audio-hujurat-12')
      };

      this.initUI();
    }

    initUI() {
      this.setupPlayer('hujurat6', 'btn-play-6', 'slider-6', 'time-6', 'QS. Al-Hujurat: 6 (Tabayyun)');
      this.setupPlayer('hujurat12', 'btn-play-12', 'slider-12', 'time-12', 'QS. Al-Hujurat: 12 (Ghibah)');

      // Top dock quick mute/stop
      const dockBtn = document.getElementById('hud-btn-audio-stop');
      if (dockBtn) {
        dockBtn.addEventListener('click', () => {
          this.pauseAll();
        });
      }
    }

    formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateGlobalDock(title, isPlaying) {
      const dockIndicator = document.getElementById('global-audio-indicator');
      const dockText = document.getElementById('global-audio-title');
      if (dockIndicator) {
        dockIndicator.classList.toggle('playing', isPlaying);
      }
      if (dockText) {
        dockText.textContent = isPlaying ? title : 'Audio Standby';
      }
    }

    setupPlayer(key, playBtnId, sliderId, timeId, title) {
      const audio = this.audioElements[key];
      const playBtn = document.getElementById(playBtnId);
      const slider = document.getElementById(sliderId);
      const timeSpan = document.getElementById(timeId);

      if (!audio || !playBtn) return;

      playBtn.addEventListener('click', () => {
        sfx.click();
        if (audio.paused) {
          this.pauseAll();
          audio.play().then(() => {
            this.setPlayIcon(playBtn, true);
            this.updateGlobalDock(title, true);
          }).catch(err => {
            console.error('Audio playback error:', err);
          });
        } else {
          audio.pause();
          this.setPlayIcon(playBtn, false);
          this.updateGlobalDock(title, false);
        }
      });

      audio.addEventListener('timeupdate', () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          const progress = (audio.currentTime / audio.duration) * 100;
          if (slider) slider.value = progress;
          if (timeSpan) {
            timeSpan.textContent = `${this.formatTime(audio.currentTime)} / ${this.formatTime(audio.duration)}`;
          }
        }
      });

      audio.addEventListener('ended', () => {
        this.setPlayIcon(playBtn, false);
        this.updateGlobalDock(title, false);
        if (slider) slider.value = 0;
      });

      if (slider) {
        slider.addEventListener('input', () => {
          if (!isNaN(audio.duration) && audio.duration > 0) {
            audio.currentTime = (slider.value / 100) * audio.duration;
          }
        });
      }
    }

    setPlayIcon(button, isPlaying) {
      if (isPlaying) {
        button.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" fill="currentColor"></rect>
            <rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>
          </svg>
        `;
        button.setAttribute('title', 'Pause Audio');
      } else {
        button.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
          </svg>
        `;
        button.setAttribute('title', 'Putar Audio Murottal');
      }
    }

    pauseAll() {
      Object.keys(this.audioElements).forEach(k => {
        const a = this.audioElements[k];
        if (a && !a.paused) {
          a.pause();
        }
      });
      const btn6 = document.getElementById('btn-play-6');
      const btn12 = document.getElementById('btn-play-12');
      if (btn6) this.setPlayIcon(btn6, false);
      if (btn12) this.setPlayIcon(btn12, false);
      this.updateGlobalDock('', false);
    }
  }

  // ==========================================================================
  // 4. LAB SIMULATOR VIDEO INTERAKTIF (3 Studi Kasus Viral Nyata)
  // ==========================================================================
  const VIDEO_CASES = [
    {
      index: 0,
      src: './WhatsApp Video 2026-10-27 at 09.38.39.mp4',
      metaTitle: 'MEMUTAR: KASUS 1 - PAMER SEDEKAH (FLEXING)',
      badge: 'STUDI KASUS RIYA & FLEXING',
      badgeClass: 'danger',
      title: 'Pamer Uang Sedekah Segepok di Media Sosial',
      desc: 'Video memperlihatkan tumpukan uang kertas pecahan besar yang dipamerkan di depan kamera dengan dalih konten sedekah dan kekayaan.',
      question: 'Bagaimana adab seorang muslim menanggapi video pamer uang sedekah ini?',
      options: [
        {
          letter: 'A',
          text: 'Menyebarkan seluas-luasnya agar viral dan terinspirasi untuk pamer uang serupa di media sosial.',
          isCorrect: false,
          feedbackHeadline: 'KEPUTUSAN KELIRU! MEMICU PENYAKIT RIYA & HASAD',
          feedbackDetail: 'Ikut memviralkan konten pamer (flexing) memicu budaya riya, ujub, dan membuat orang lain merasa rendah diri atau iri dengki (hasad). Perilaku ini bertentangan dengan adab sedekah dalam Islam.',
          dalilQuote: 'QS. Al-Baqarah: 264 - "Janganlah kamu merusak sedekahmu dengan menyebut-nyebutnya dan menyakiti (perasaan penerima), seperti orang yang menginfakkan hartanya karena riya (pamer) kepada manusia."'
        },
        {
          letter: 'B',
          text: 'Tidak ikut menyebarkan, menasihati bahaya riya yang menghapus pahala, dan menjaga sedekah sembunyi-sembunyi.',
          isCorrect: true,
          feedbackHeadline: 'KEPUTUSAN TEPAT! MENJAGA KEIKHLASAN & MARWAH IBADAH',
          feedbackDetail: 'Sedekah yang paling utama adalah yang dirahasiakan agar terhindar dari penyakit riya. Menahan diri dari memviralkan konten flexing adalah bentuk amar maruf dan menjaga kebersihan hati.',
          dalilQuote: 'HR. Bukhari & Muslim - "Tujuh golongan yang dinaungi Allah di hari kiamat, salah satunya: Seseorang yang bersedekah secara sembunyi-sembunyi hingga tangan kirinya tidak mengetahui apa yang diinfakkan tangan kanannya."'
        }
      ]
    },
    {
      index: 1,
      src: './WhatsApp Video 2026-10-27 at 09.39.14.mp4',
      metaTitle: 'MEMUTAR: KASUS 2 - SERUAN DAKWAH TAUBAT',
      badge: 'DAKWAH BIL QALAM & AMAR MARUF',
      badgeClass: 'halal',
      title: 'Tausiyah Ajakan Bertaubat dari Ahli Agama',
      desc: 'Video ceramah menyejukkan dari ulama/ahli agama yang mengingatkan pentingnya kembali kepada Allah, memohon ampunan, dan meninggalkan maksiat.',
      question: 'Bagaimana sikap adab kita terhadap video dakwah dan ajakan taubat ini?',
      options: [
        {
          letter: 'A',
          text: 'Mendengarkan dengan khusyuk, mengambil ibrah, dan halal/sangat dianjurkan menyebarkannya sebagai amal jariyah.',
          isCorrect: true,
          feedbackHeadline: 'KEPUTUSAN TEPAT! LADANG AMAL JARIYAH & SYIAR ISLAM',
          feedbackDetail: 'Konten dakwah dari ahli agama yang shahih sangat bermanfaat untuk dibagikan (share) di media sosial. Ini adalah pemanfaatan teknologi yang sesuai dengan tujuan syariat (Hifzhud Din) dan bernilai pahala mengalir.',
          dalilQuote: 'HR. Muslim - "Barang siapa yang menunjukkan kepada suatu kebaikan, maka baginya pahala seperti pahala orang yang mengerjakannya."'
        },
        {
          letter: 'B',
          text: 'Mengabaikannya atau mencela di kolom komentar karena merasa diri tidak butuh nasihat taubat.',
          isCorrect: false,
          feedbackHeadline: 'KEPUTUSAN KELIRU! KESOMBONGAN MENOLAK KEBENARAN',
          feedbackDetail: 'Menolak nasihat kebenaran agama adalah tanda penyakit kesombongan (al-kibr). Setiap manusia butuh diingatkan agar hatinya tidak keras dan lalai.',
          dalilQuote: 'HR. Muslim - "Kesombongan adalah menolak kebenaran (batharul haqq) dan meremehkan manusia (ghamthun naas)."'
        }
      ]
    },
    {
      index: 2,
      src: './WhatsApp Video 2026-10-27 at 09.40.03.mp4',
      metaTitle: 'MEMUTAR: KASUS 3 - SEBAR VIDEO SYUR MANTAN (REVENGE PORN)',
      badge: 'DOSA BESAR, AIB & FITNAH',
      badgeClass: 'danger',
      title: 'Pria Sebar Video Syur Mantan Karena Putus Cinta',
      desc: 'Tragedi balas dendam asmara di mana pelaku menyebarkan video intim/pornografi mantan pasangannya ke media sosial dan situs asusila.',
      question: 'Bagaimana hukum syariat dan tindakan adab yang wajib diambil?',
      options: [
        {
          letter: 'A',
          text: 'Ikut membagikan link atau mengunduh video tersebut karena penasaran dengan gosip viral.',
          isCorrect: false,
          feedbackHeadline: 'PERINGATAN KERAS! HARAM MUTLAK & TERANCAM PIDANA',
          feedbackDetail: 'Menyebarkan, menonton, atau menyimpan video asusila adalah dosa besar menyebarkan kekejian (fahisyah). Selain diancam azab pedih di akhirat, perbuatan ini merupakan tindak pidana berat yang diancam hukuman penjara dalam UU Pornografi dan UU ITE Pasal 27 ayat 1.',
          dalilQuote: 'QS. An-Nur: 19 - "Sesungguhnya orang-orang yang ingin agar perbuatan yang sangat keji (fahisyah) itu tersiar di kalangan orang-orang yang beriman, bagi mereka azab yang pedih di dunia dan di akhirat."'
        },
        {
          letter: 'B',
          text: 'Jangan tonton, jangan share, segera report/laporkan akun pelaku, dan bantu menutup aib korban.',
          isCorrect: true,
          feedbackHeadline: 'KEPUTUSAN TEPAT! WAJIB MENUTUP AIB & CEGAH KEMUNGKARAN',
          feedbackDetail: 'Kewajiban setiap muslim adalah menjaga kehormatan sesama (Hifzhul Karomah) dan mencegah peredaran konten maksiat dengan cara me-report konten/akun pelaku kepada platform dan pihak berwajib.',
          dalilQuote: 'QS. Al-Hujurat: 12 & HR. Muslim - "Barang siapa menutupi (aib) seorang muslim, maka Allah akan menutupi aibnya di dunia dan di akhirat."'
        }
      ]
    }
  ];

  let currentVideoCaseIdx = 0;
  let barakahScore = 100;

  function setupInteractiveVideoSimulator() {
    const videoEl = document.getElementById('lab-main-video');
    const videoWrapper = document.getElementById('video-wrapper');
    const videoLabGrid = document.getElementById('video-lab-grid');
    const metaTitleEl = document.getElementById('video-meta-title');
    const badgeEl = document.getElementById('video-case-badge');
    const titleEl = document.getElementById('video-case-title');
    const descEl = document.getElementById('video-case-desc');
    const optionsContainer = document.getElementById('video-options-container');
    const feedbackCard = document.getElementById('video-feedback-card');
    const barakahEl = document.getElementById('sim-barakah-points');
    const tabButtons = document.querySelectorAll('.btn-video-tab');
    const nextBtn = document.getElementById('btn-video-next-case');

    // Zoom Toolbar buttons
    const btnZoomIn = document.getElementById('btn-video-zoom-in');
    const btnZoomOut = document.getElementById('btn-video-zoom-out');
    const btnFullscreen = document.getElementById('btn-video-fullscreen');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        sfx.click();
        if (videoWrapper) videoWrapper.classList.add('zoomed');
        if (videoLabGrid) videoLabGrid.classList.add('theater-mode');
        btnZoomIn.classList.add('active');
        if (btnZoomOut) btnZoomOut.classList.remove('active');
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        sfx.click();
        if (videoWrapper) videoWrapper.classList.remove('zoomed');
        if (videoLabGrid) videoLabGrid.classList.remove('theater-mode');
        btnZoomOut.classList.add('active');
        if (btnZoomIn) btnZoomIn.classList.remove('active');
      });
    }

    if (btnFullscreen && videoEl) {
      btnFullscreen.addEventListener('click', () => {
        sfx.click();
        if (videoEl.requestFullscreen) {
          videoEl.requestFullscreen().catch(() => {});
        } else if (videoEl.webkitRequestFullscreen) {
          videoEl.webkitRequestFullscreen();
        }
      });
    }

    function loadVideoCase(idx) {
      const data = VIDEO_CASES[idx];
      if (!data) return;

      currentVideoCaseIdx = idx;

      // Update tabs
      tabButtons.forEach((tab, i) => {
        tab.classList.toggle('active', i === idx);
      });

      // Update video source & state
      if (videoEl) {
        videoEl.pause();
        videoEl.src = data.src;
        videoEl.load();
      }

      if (metaTitleEl) metaTitleEl.textContent = data.metaTitle;
      if (badgeEl) {
        badgeEl.textContent = data.badge;
        badgeEl.className = `video-case-badge ${data.badgeClass}`;
      }
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.desc;

      // Reset feedback
      if (feedbackCard) {
        feedbackCard.className = 'video-feedback-card';
        feedbackCard.innerHTML = '';
      }

      // Render response options
      if (optionsContainer) {
        optionsContainer.innerHTML = '';
        data.options.forEach((opt, optIdx) => {
          const btn = document.createElement('button');
          btn.className = 'btn-response-option';
          btn.innerHTML = `
            <div class="response-opt-indicator">${opt.letter}</div>
            <div style="flex: 1;">${opt.text}</div>
          `;

          btn.addEventListener('click', () => {
            handleVideoChoice(btn, opt, data);
          });

          optionsContainer.appendChild(btn);
        });
      }
    }

    function handleVideoChoice(selectedBtn, optionData, caseData) {
      const allBtns = optionsContainer.querySelectorAll('.btn-response-option');
      allBtns.forEach(b => b.disabled = true);

      if (optionData.isCorrect) {
        sfx.correct();
        barakahScore += 35;
        selectedBtn.classList.add('chosen-correct');
        if (feedbackCard) {
          feedbackCard.className = 'video-feedback-card show correct';
          feedbackCard.innerHTML = `
            <div class="feedback-headline" style="color: var(--islamic-emerald)">
              <svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${optionData.feedbackHeadline}</span>
            </div>
            <div class="feedback-details">${optionData.feedbackDetail}</div>
            <div class="feedback-dalil-quote"><strong>LANDASAN SYARIAT:</strong> ${optionData.dalilQuote}</div>
          `;
        }
      } else {
        sfx.wrong();
        barakahScore = Math.max(0, barakahScore - 25);
        selectedBtn.classList.add('chosen-wrong');
        if (feedbackCard) {
          feedbackCard.className = 'video-feedback-card show wrong';
          feedbackCard.innerHTML = `
            <div class="feedback-headline" style="color: var(--danger)">
              <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              <span>${optionData.feedbackHeadline}</span>
            </div>
            <div class="feedback-details">${optionData.feedbackDetail}</div>
            <div class="feedback-dalil-quote"><strong>PERINGATAN QURANI:</strong> ${optionData.dalilQuote}</div>
          `;
        }
      }

      if (barakahEl) barakahEl.textContent = barakahScore + ' Barakah';
    }

    // Tab buttons event listeners
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sfx.click();
        const targetIdx = parseInt(btn.getAttribute('data-video-index'), 10);
        loadVideoCase(targetIdx);
      });
    });

    // Stepper to next case
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        sfx.click();
        const nextIdx = (currentVideoCaseIdx + 1) % VIDEO_CASES.length;
        loadVideoCase(nextIdx);
      });
    }

    // Initial load first case
    loadVideoCase(0);
  }



  // ==========================================================================
  // 6. KAJIAN STUDI KASUS NAVIGATOR (Stage 4)
  // ==========================================================================
  const CASE_STUDIES = [
    {
      id: 'case-1',
      title: 'KASUS 01: Spill Aib Teman & Doxing Medsos',
      label: 'KASUS 1: Spill Aib & Doxing',
      summary: 'Seorang siswa merekam pertengkaran teman sekelasnya lalu mengunggah potongan video 15 detik ke media sosial dengan narasi menyudutkan hingga video ditonton ratusan ribu kali.',
      impacts: [
        'Korban mengalami tekanan psikologis berat dan enggan masuk sekolah (cyberbullying).',
        'Rusaknya nama baik dan marwah (kehormatan) keluarga kedua belah pihak.',
        'Memicu permusuhan massal di kolom komentar antar kelompok teman.'
      ],
      islamicLaw: 'HARAM MUTLAK. Mengunggah aib sesama merupakan dosa ghibah dan tajassus yang diharamkan Allah dalam QS. Al-Hujurat: 12. Menggunjing sesama diumpamakan seperti memakan bangkai saudaranya sendiri yang sudah mati.',
      solusi: 'Memohon maaf langsung kepada korban, segera menghapus konten (takedown), dan mengamalkan prinsip Sitrul Aurah (menutup celah aib sesama).'
    },
    {
      id: 'case-2',
      title: 'KASUS 02: Tragedi Hoaks & Fitnah Akun Gosip',
      label: 'KASUS 2: Fitnah Hoaks Viral',
      summary: 'Sebuah akun gosip mengunggah tangkapan layar chat yang direkayasa menuduh seorang guru berbuat tidak senonoh. Informasi tersebut diteruskan ribuan kali tanpa ada yang mengecek kebenarannya.',
      impacts: [
        'Keluarga korban mendapat ancaman kekerasan fisik dan pengucilan sosial.',
        'Penyebar konten terancam pidana Pasal 27 & 28 UU ITE.',
        'Terjadinya penyesalan massal saat fakta asli terungkap (namun dampak nama baik sudah hancur).'
      ],
      islamicLaw: 'DOSA BESAR (FITNAH). Sesuai QS. Al-Hujurat: 6, menerima dan menyebarkan berita tanpa tabayyun adalah perilaku orang fasik yang dapat mencelakakan suatu kaum karena kecerobohan.',
      solusi: 'Menerapkan protokol 3C sebelum share: Cek Sumber Resmi, Cek Fakta Pembanding, Cek Manfaat bagi Umat.'
    },
    {
      id: 'case-3',
      title: 'KASUS 03: Riya & Flexing Berkedok Ibadah',
      label: 'KASUS 3: Riya & Flexing Ibadah',
      summary: 'Mengunggah video sholat malam atau ibadah haji dengan niat mengharapkan pujian, validasi followers, dan merendahkan orang lain yang belum mampu beribadah.',
      impacts: [
        'Gugurnya pahala amal kebaikan karena masuknya penyakit syirik kecil (riya).',
        'Menimbulkan sifat iri dan suudzan di kalangan pengguna media sosial.',
        'Membangun budaya keberagamaan semu yang berorientasi pada pencitraan layar kaca.'
      ],
      islamicLaw: 'TERLARANG (MAKRUH SAMPAI HARAM). Rasulullah SAW bersabda dalam hadits HR. Bukhari bahwa amal tergantung pada niat. Memamerkan ibadah demi followers menghancurkan keberkahan amal.',
      solusi: 'Menjaga keikhlasan hati, menyembunyikan ibadah sunnah sebagaimana menyembunyikan aib diri, dan hanya membagikan konten yang murni mengedukasi tanpa menonjolkan diri.'
    }
  ];

  function setupCaseStudies() {
    const navContainer = document.getElementById('case-nav-list');
    const titleEl = document.getElementById('case-detail-title');
    const summaryEl = document.getElementById('case-detail-summary');
    const impactListEl = document.getElementById('case-impact-list');
    const islamicLawEl = document.getElementById('case-islamic-law');
    const solusiEl = document.getElementById('case-solusi');

    if (!navContainer) return;

    navContainer.innerHTML = '';
    CASE_STUDIES.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = `case-nav-btn ${index === 0 ? 'active' : ''}`;
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        sfx.click();
        document.querySelectorAll('.case-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCase(index);
      });
      navContainer.appendChild(btn);
    });

    function renderCase(idx) {
      const data = CASE_STUDIES[idx];
      if (!data) return;

      if (titleEl) titleEl.textContent = data.title;
      if (summaryEl) summaryEl.textContent = data.summary;
      if (islamicLawEl) islamicLawEl.textContent = data.islamicLaw;
      if (solusiEl) solusiEl.textContent = data.solusi;

      if (impactListEl) {
        impactListEl.innerHTML = '';
        data.impacts.forEach(imp => {
          const div = document.createElement('div');
          div.className = 'impact-item';
          div.innerHTML = `
            <svg class="icon icon-sm" viewBox="0 0 24 24" style="color: var(--danger)">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${imp}</span>
          `;
          impactListEl.appendChild(div);
        });
      }
    }

    renderCase(0);
  }

  // ==========================================================================
  // 7. ARENA KUIS INTERAKTIF & AUTOMATED SCORING (Stage 5)
  // ==========================================================================
  const QUIZ_QUESTIONS = [
    {
      q: 'Dalam QS. Al-Hujurat ayat 6, langkah utama apa yang diperintahkan Allah Swt. ketika seorang fasik membawa suatu berita?',
      opts: [
        'Langsung membagikannya ke grup media sosial agar semua orang waspada',
        'Meneliti kebenaran berita tersebut (Tabayyun) sebelum bertindak',
        'Membuat postingan balasan yang lebih provokatif',
        'Memblokir akun pengirim tanpa membaca isinya'
      ],
      correct: 1,
      explanation: 'QS. Al-Hujurat: 6 menegaskan perintah "fa tabayyanuu" (maka telitilah kebenarannya), agar kita tidak mencelakakan orang lain karena ketidaktahuan yang berujung pada penyesalan.'
    },
    {
      q: 'Menurut QS. Al-Hujurat ayat 12, orang yang suka mencari-cari kesalahan orang lain dan menggunjing diibaratkan seperti apa?',
      opts: [
        'Bagaikan debu yang diterbangkan angin kencang',
        'Bagaikan memakan buah yang pahit dan beracun',
        'Bagaikan orang yang memakan daging bangkai saudaranya sendiri',
        'Bagaikan membangun rumah di atas pasir yang rapuh'
      ],
      correct: 2,
      explanation: 'Allah Swt. secara gamblang mengibaratkan pelaku ghibah (menggunjing/menyebarkan aib sesama) seperti orang yang memakan daging saudaranya yang sudah meninggal.'
    },
    {
      q: 'Hadits shahih riwayat Bukhari dan Muslim menyebutkan bahwa tanda orang yang beriman kepada Allah dan hari akhir adalah...',
      opts: [
        'Mempunyai jumlah followers dan likes terbanyak di media sosial',
        'Selalu menjadi yang pertama mengunggah peristiwa viral',
        'Berkata yang baik atau memilih diam (fal yaqul khairan au liyashmut)',
        'Mampu membalas komentar pedas netizen dengan kalimat tajam'
      ],
      correct: 2,
      explanation: 'Rasulullah SAW bersabda: "Man kaana yu\'minu billahi wal yaumil aakhiri fal yaqul khairan au liyashmut" (Barang siapa beriman kepada Allah dan hari akhir, hendaklah berkata baik atau diam).'
    },
    {
      q: 'Bagaimana adab Islami yang benar jika kita ingin mengunggah foto atau video yang memuat orang lain di media sosial?',
      opts: [
        'Bebas diunggah kapan saja asalkan tidak ada nama lengkapnya',
        'Wajib meminta izin terlebih dahulu demi menghormati privasi dan kenyamanannya',
        'Diunggah dulu, baru minta maaf jika orang tersebut merasa tersinggung',
        'Cukup diberi filter lucu agar tidak terlihat terlalu memalukan'
      ],
      correct: 1,
      explanation: 'Menghormati hak privasi sesama muslim adalah kewajiban akhlak (Hifzhul Karomah). Mengunggah dokumentasi orang lain tanpa izin dapat melanggar kenyamanan dan hak asasinya.'
    },
    {
      q: 'Apa bahaya terbesar membagikan video atau foto amal ibadah pribadi dengan tujuan mengharapkan pujian manusia?',
      opts: [
        'Kuota internet cepat habis',
        'Terjadinya riya (syirik kecil) yang dapat menghanguskan pahala amal tersebut',
        'Akun media sosial akan terkena suspend otomatis oleh sistem',
        'Memicu banyak akun robot yang mengirimkan komentar spam'
      ],
      correct: 1,
      explanation: 'Riya adalah penyakit hati yang merusak keikhlasan ibadah. Amal shaleh yang dikerjakan demi pamrih dan pujian manusia akan sia-sia di hadapan Allah Swt.'
    },
    {
      q: 'Apa intisari kesimpulan dari makalah tentang adab bermedia sosial yang harus kita terapkan sebagai generasi muslim?',
      opts: [
        'Menghindari seluruh teknologi internet dan menutup semua akun digital',
        'Menggunakan medsos secara bijak, bertanggung jawab, membawa manfaat, dan menjauhi mudarat',
        'Hanya membagikan video hiburan tanpa memikirkan nilai-nilai keagamaan',
        'Bebas berekspresi tanpa batas karena media sosial adalah dunia maya'
      ],
      correct: 1,
      explanation: 'Media sosial adalah sarana. Tanggung jawab seorang muslim adalah memanfaatkannya untuk dakwah, ilmu, dan silaturahmi yang membawa maslahat bagi diri dan sesama.'
    }
  ];

  let quizCurrentIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  function setupQuiz() {
    quizCurrentIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    renderQuizQuestion(quizCurrentIndex);

    const btnNext = document.getElementById('btn-quiz-next');
    const btnRestart = document.getElementById('btn-quiz-restart');

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        sfx.click();
        if (quizCurrentIndex < QUIZ_QUESTIONS.length - 1) {
          quizCurrentIndex++;
          renderQuizQuestion(quizCurrentIndex);
        } else {
          showQuizResult();
        }
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        sfx.click();
        setupQuiz();
        document.getElementById('quiz-result-view').style.display = 'none';
        document.getElementById('quiz-question-box').style.display = 'block';
      });
    }
  }

  function renderQuizQuestion(idx) {
    quizAnswered = false;
    const qData = QUIZ_QUESTIONS[idx];
    if (!qData) return;

    const counterEl = document.getElementById('quiz-q-counter');
    const scoreEl = document.getElementById('quiz-score-val');
    const titleEl = document.getElementById('quiz-question-title');
    const optionsGrid = document.getElementById('quiz-options-grid');
    const explanationCard = document.getElementById('quiz-explanation-card');
    const btnNext = document.getElementById('btn-quiz-next');

    if (counterEl) counterEl.textContent = `SOAL ${idx + 1} DARI ${QUIZ_QUESTIONS.length}`;
    if (scoreEl) scoreEl.textContent = `SKOR: ${quizScore}`;
    if (titleEl) titleEl.textContent = qData.q;
    if (btnNext) btnNext.style.display = 'none';

    if (explanationCard) {
      explanationCard.classList.remove('show');
      explanationCard.innerHTML = '';
    }

    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];

      qData.opts.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.innerHTML = `
          <span class="opt-letter">${letters[optIdx]}</span>
          <span class="opt-text">${optText}</span>
        `;

        btn.addEventListener('click', () => {
          if (quizAnswered) return;
          quizAnswered = true;

          const isCorrect = optIdx === qData.correct;
          const allButtons = optionsGrid.querySelectorAll('.quiz-opt-btn');

          allButtons.forEach((b, i) => {
            b.disabled = true;
            if (i === qData.correct) {
              b.classList.add('correct');
            } else if (i === optIdx && !isCorrect) {
              b.classList.add('wrong');
            }
          });

          if (isCorrect) {
            sfx.correct();
            quizScore += Math.round(100 / QUIZ_QUESTIONS.length);
          } else {
            sfx.wrong();
          }

          if (scoreEl) scoreEl.textContent = `SKOR: ${quizScore}`;

          // Show explanation
          if (explanationCard) {
            explanationCard.classList.add('show');
            explanationCard.innerHTML = `
              <div class="explanation-title">
                <svg class="icon icon-sm" viewBox="0 0 24 24" style="color: var(--islamic-emerald)">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>PENJELASAN HUKUM & DALIL:</span>
              </div>
              <div class="explanation-body">${qData.explanation}</div>
            `;
          }

          if (btnNext) {
            btnNext.style.display = 'inline-flex';
            btnNext.textContent = idx === QUIZ_QUESTIONS.length - 1 ? 'LIHAT HASIL EVALUASI' : 'SOAL BERIKUTNYA';
          }
        });

        optionsGrid.appendChild(btn);
      });
    }
  }

  function showQuizResult() {
    sfx.fanfare();
    const resultView = document.getElementById('quiz-result-view');
    const questionBox = document.getElementById('quiz-question-box');
    const badgeCircle = document.getElementById('quiz-result-badge');
    const verdictTitle = document.getElementById('quiz-result-verdict');
    const verdictDesc = document.getElementById('quiz-result-desc');

    if (questionBox) questionBox.style.display = 'none';
    if (resultView) resultView.style.display = 'block';

    const finalScore = Math.min(100, quizScore);
    if (badgeCircle) badgeCircle.textContent = finalScore;

    let verdict = 'MUTTAQIN DIGITAL (NILAI SEMPURNA)';
    let desc = 'MasyaAllah! Anda memahami seluruh dalil QS. Al-Hujurat 6 & 12 serta adab syariat dalam bermedia sosial dengan sangat sempurna. Teruslah menjadi teladan kebaikan di ruang digital!';

    if (finalScore < 70) {
      verdict = 'PEJUANG TABAYYUN (PERLU PENGUATAN)';
      desc = 'Hasil yang cukup baik, namun penting untuk terus memperdalam pemahaman dalil tabayyun dan menjaga diri dari bahaya ghibah digital.';
    } else if (finalScore < 90) {
      verdict = 'GENERASI BIJAK DIGITAL';
      desc = 'Sangat baik! Anda memiliki dasar adab bermedia sosial yang kokoh sesuai nilai-nilai Islam.';
    }

    if (verdictTitle) verdictTitle.textContent = verdict;
    if (verdictDesc) verdictDesc.textContent = desc;
  }

  // ==========================================================================
  // 8. GLOBAL KEYBOARD & CONTROLLER SHORTCUTS
  // ==========================================================================
  function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        if (currentStageIndex < STAGES.length - 1) {
          setStage(currentStageIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        if (currentStageIndex > 0) {
          setStage(currentStageIndex - 1);
        }
      } else if (e.key >= '1' && e.key <= '7') {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (targetIdx >= 0 && targetIdx < STAGES.length) {
          setStage(targetIdx);
        }
      }
    });

    const prevBtn = document.getElementById('btn-prev-stage');
    const nextBtn = document.getElementById('btn-next-stage');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStageIndex > 0) setStage(currentStageIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentStageIndex < STAGES.length - 1) setStage(currentStageIndex + 1);
      });
    }

    // Stage Selector Strip
    const stageStrip = document.getElementById('stage-selector-strip');
    if (stageStrip) {
      stageStrip.innerHTML = '';
      STAGES.forEach((stg, idx) => {
        const btn = document.createElement('button');
        btn.className = `btn-stage-slot ${idx === 0 ? 'active' : ''}`;
        btn.textContent = stg.name;
        btn.setAttribute('title', stg.title);
        btn.addEventListener('click', () => {
          setStage(idx);
        });
        stageStrip.appendChild(btn);
      });
    }

    // Start Mission button on Intro stage
    const btnStart = document.getElementById('btn-start-mission');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        setStage(1);
      });
    }

    // Toggle Sound SFX
    const btnMute = document.getElementById('hud-btn-sfx-toggle');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        sfx.muted = !sfx.muted;
        btnMute.classList.toggle('active', !sfx.muted);
        const label = btnMute.querySelector('.hud-btn-label');
        if (label) label.textContent = sfx.muted ? 'SFX: OFF' : 'SFX: ON';
      });
    }

    // Fullscreen Toggle
    const btnFull = document.getElementById('hud-btn-fullscreen');
    if (btnFull) {
      btnFull.addEventListener('click', () => {
        sfx.click();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  // ==========================================================================
  // INITIALIZATION ON DOM READY
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Audio Engine
    const audioEngine = new AudioEngine();

    // 2. Setup Stage Navigation & Controls
    setupKeyboardControls();

    // 3. Setup Interactive Video Simulator
    setupInteractiveVideoSimulator();

    // 4. Setup Case Studies
    setupCaseStudies();

    // 5. Setup Quiz
    setupQuiz();

    // Default to Stage 0
    setStage(0);
  });
})();
