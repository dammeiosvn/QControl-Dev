const DEV_MODE = true; 

const PRESET_VERSION = 2; // Tăng version để hiển thị lại chấm đỏ thông báo có preset mới
const THEME_VERSION = 2;

// ==========================================
// 1. DATA ĐỔ BÓNG (SHADOW MODES)
// ==========================================
const SHADOW_MODES = [
    { id: 'inset', nameKey: 'shadow_inset', name: 'Bóng Chìm',     template: 'inset {x}px {y}px {b}px {s}px {c}' },
    { id: 'outer', nameKey: 'shadow_outer', name: 'Bóng Ngoài',    template: '{x}px {y}px {b}px {s}px {c}' },
    { id: 'soft',  nameKey: 'shadow_soft',  name: 'Mờ Diện Rộng',  template: '{x}px {y}px {b}px {s}px {c}' },
    { id: 'hard',  nameKey: 'shadow_hard',  name: 'Nổi Khối 3D',   template: '{x}px {y}px 0px {s}px {c}' },
    { id: 'glow',  nameKey: 'shadow_glow',  name: 'Phát Sáng',     template: '0px 0px {b}px {s}px {c}' },
    { id: 'bottom',    nameKey: 'shadow_bottom',    name: 'Bóng Dưới (Apple)', template: '0px {y}px {b}px {s}px {c}' },
    { id: 'floating',  nameKey: 'shadow_floating',  name: 'Nổi Bay',            template: '0px {b}px {b}px calc(-1 * {s}px) {c}' },
    { id: 'pressed',   nameKey: 'shadow_pressed',   name: 'Ấn Xuống',           template: 'inset 0px {y}px {b}px {s}px {c}' },
    { id: 'pop',       nameKey: 'shadow_pop',       name: 'Pop Bubble',         template: '0px {y}px 0px 0px {c}' },
    { id: 'double',    nameKey: 'shadow_double',    name: 'Viền Kép',           template: '{x}px {y}px {b}px {s}px {c}, inset calc(-1 * {x}px) calc(-1 * {y}px) {b}px 0px rgba(255,255,255,0.15)' },
    { id: 'neumorph',  nameKey: 'shadow_neumorph',  name: 'Neumorphism Nổi',    template: 'calc(-1 * {x}px) calc(-1 * {y}px) {b}px rgba(255,255,255,0.4), {x}px {y}px {b}px {c}' },
    { id: 'neuro_in',  nameKey: 'shadow_neuro_in',  name: 'Neumorphism Chìm',   template: 'inset calc(-1 * {x}px) calc(-1 * {y}px) {b}px rgba(255,255,255,0.4), inset {x}px {y}px {b}px {c}' },
    { id: 'neon',      nameKey: 'shadow_neon',      name: 'Neon RGB',           template: '0px 0px {b}px {c}, 0px 0px {b}px {c}, 0px 0px {b}px {c}' },
    { id: 'long',      nameKey: 'shadow_long',      name: 'Bóng Dài Retro',     template: '{x}px {y}px 0px 0px {c}' },
    { id: 'crisp',     nameKey: 'shadow_crisp',     name: 'Sắc Nét Nhẹ',        template: '0px 1px 2px 0px {c}' },
    { id: 'ripple',    nameKey: 'shadow_ripple',    name: 'Sóng Nước',          template: '0px {y}px {b}px {s}px {c}, 0px {y}px {b}px {s}px {c}' },
    { id: 'clay',      nameKey: 'shadow_clay',      name: 'Đất Sét 3D',         template: 'inset 0px calc(-1 * {y}px) {b}px rgba(255,255,255,0.3), inset 0px {y}px {b}px rgba(0,0,0,0.2), 0px {y}px {b}px {c}' }
];

document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;
    const mainContainer = document.getElementById('main-container');
    const drawerEl = document.getElementById('settings-drawer');
    const overlay = document.getElementById('settings-overlay');

    if (!DEV_MODE) document.body.classList.add('standard-mode');

    // ==========================================
    // 2. KHỞI TẠO GIAO DIỆN & TABS
    // ==========================================
    try {
        const badgePreset = document.getElementById('badge-preset');
        const badgeTheme = document.getElementById('badge-theme');
        
        const seenPresetVersion = parseInt(localStorage.getItem('sttv_presetVersionSeen') || '0');
        if (badgePreset) {
            if (seenPresetVersion >= PRESET_VERSION) badgePreset.classList.add('hidden');
            else badgePreset.classList.remove('hidden');
        }
        
        const seenThemeVersion = parseInt(localStorage.getItem('sttv_themeVersionSeen') || '0');
        if (badgeTheme) {
            if (seenThemeVersion >= THEME_VERSION) badgeTheme.classList.add('hidden');
            else badgeTheme.classList.remove('hidden');
        }

        // Logic chuyển Tab
        const tabButtons = document.querySelectorAll('.settings-tab');
        const tabContents = document.querySelectorAll('.settings-tab-content');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetContent = document.querySelector(`.settings-tab-content[data-tab="${targetTab}"]`);
                if (targetContent) targetContent.classList.add('active');
                try { localStorage.setItem('sttv_activeTab', targetTab); } catch(e) {}
                try { playTick(); } catch(e) {}
            });
        });

        const savedTab = localStorage.getItem('sttv_activeTab');
        if (savedTab) {
            const savedBtn = document.querySelector(`.settings-tab[data-tab="${savedTab}"]`);
            const savedContent = document.querySelector(`.settings-tab-content[data-tab="${savedTab}"]`);
            if (savedBtn && savedContent) {
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                savedBtn.classList.add('active');
                savedContent.classList.add('active');
            }
        }

        // Tooltip cho Slider
        let globalTooltip = document.createElement('div');
        globalTooltip.className = 'slider-tooltip';
        document.body.appendChild(globalTooltip);

        let rafId = null;
        document.addEventListener('input', (e) => {
            if (e.target && e.target.type === 'range') {
                const input = e.target;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    globalTooltip.innerText = input.value;
                    globalTooltip.classList.add('show');
                    const rect = input.getBoundingClientRect();
                    const min = parseFloat(input.min) || 0;
                    const max = parseFloat(input.max) || 100;
                    const val = parseFloat(input.value);
                    const percent = (val - min) / (max - min);
                    const thumbOffset = 12.5 - (percent * 25);
                    const thumbX = rect.left + (percent * rect.width) + thumbOffset;
                    globalTooltip.style.left = `${thumbX}px`;
                    globalTooltip.style.top = `${rect.top - 35}px`;
                });
                try { playTick(); } catch(e) {}
                if (e.target.id !== 'val-theme-preset' && e.target.id !== 'val-popup-anim') {
                    resetPresetToCustom();
                }
                updateLiveVariables(false); 
            }
        });

        const hideTooltip = (e) => {
            if (e.target && e.target.type === 'range') globalTooltip.classList.remove('show');
        };
        document.addEventListener('pointerup', hideTooltip);
        document.addEventListener('touchend', hideTooltip);
        document.addEventListener('change', (e) => {
            if (e.target && e.target.type === 'range') {
                hideTooltip(e);
                saveSettingsToLocal();
            }
        });

        // ==========================================
        // 3. TẠO GIAO DIỆN BÓNG (SHADOW) ĐỘNG
        // Đã áp dụng class ép dọc, dạt trái chuẩn của sếp
        // ==========================================
        try {
            const shadowContainer = document.getElementById('shadow-controls');
            if (shadowContainer) {
                SHADOW_MODES.forEach(mode => {
                    const div = document.createElement('div');
                    div.className = 'shadow-item dev-only';
                    div.innerHTML = `
                        <div class="shadow-header">
                            <span data-i18n="${mode.nameKey}">${mode.name}</span>
                            <input type="checkbox" name="active_shadow" value="${mode.id}" class="shadow-switch">
                        </div>
                        <div class="shadow-drawer" id="drawer-${mode.id}">
                            <div class="slider-item">
                                <span class="slider-label" data-i18n="slider_x">Trục X</span>
                                <input type="range" class="s-x" min="-20" max="20" value="0">
                            </div>
                            <div class="slider-item">
                                <span class="slider-label" data-i18n="slider_y">Trục Y</span>
                                <input type="range" class="s-y" min="-20" max="20" value="4">
                            </div>
                            <div class="slider-item">
                                <span class="slider-label" data-i18n="slider_blur">Độ mờ</span>
                                <input type="range" class="s-b" min="0" max="50" value="10">
                            </div>
                            <div class="slider-item">
                                <span class="slider-label" data-i18n="slider_spread">Lan rộng</span>
                                <input type="range" class="s-s" min="-10" max="30" value="0">
                            </div>
                            <div class="slider-item">
                                <span class="slider-label" data-i18n="slider_opacity">Độ đậm bóng</span>
                                <input type="range" class="s-o" min="0" max="100" value="100">
                            </div>
                            <div class="color-swatch-row" style="margin-top: 5px;">
                                <div class="color-swatch">
                                    <span class="swatch-label" data-i18n="slider_color">Màu Bóng</span>
                                    <input type="color" class="s-c" value="#000000">
                                </div>
                            </div>
                        </div>
                    `;
                    shadowContainer.appendChild(div);
                });
            }
            // Gọi i18n lại một lần để dịch các thẻ bóng vừa tạo
            if (window.applyI18n) window.applyI18n();
        } catch(errShadow) {
            console.error('Shadow render failed:', errShadow);
        }

        // ==========================================
        // 4. MODAL & CÁC CHỨC NĂNG BỔ TRỢ
        // ==========================================
        let currentThemeTarget = 'frame';
        function syncThemePickerVisuals(val) {
            document.querySelectorAll('.theme-chip').forEach(c => {
                if (c.dataset.value === val) c.classList.add('active');
                else c.classList.remove('active');
            });
        }

        const themeModal = document.getElementById('theme-modal');
        const themeOverlay = document.getElementById('theme-overlay');
        const btnMoreThemes = document.getElementById('btn-more-themes');
        
        if (btnMoreThemes) {
            btnMoreThemes.onclick = () => { 
                currentThemeTarget = 'frame';
                const vtf = document.getElementById('val-theme-frame');
                if (vtf) syncThemePickerVisuals(vtf.value);
                if (themeModal) themeModal.classList.add('show');
                if (themeOverlay) themeOverlay.classList.add('show'); 
            };
        }

        const btnThumbTheme = document.getElementById('btn-thumb-theme');
        if (btnThumbTheme) {
            btnThumbTheme.onclick = () => {
                currentThemeTarget = 'thumb';
                const vtt = document.getElementById('val-thumb-theme');
                if (vtt) syncThemePickerVisuals(vtt.value);
                if (themeModal) themeModal.classList.add('show');
                if (themeOverlay) themeOverlay.classList.add('show'); 
            };
        }

        document.querySelectorAll('.theme-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const val = chip.dataset.value;
                syncThemePickerVisuals(val);
                if (currentThemeTarget === 'frame') {
                    const vtf = document.getElementById('val-theme-frame');
                    if (vtf) vtf.value = val;
                    if (badgeTheme) { 
                        badgeTheme.classList.add('hidden'); 
                        localStorage.setItem('sttv_themeVersionSeen', String(THEME_VERSION)); 
                    }
                    resetPresetToCustom();
                } else if (currentThemeTarget === 'thumb') {
                    const vtt = document.getElementById('val-thumb-theme');
                    if (vtt) vtt.value = val;
                }
                updateLiveVariables(true);
            });
        });

        const closeThemeModal = document.getElementById('close-theme-modal');
        if (closeThemeModal && themeModal) closeThemeModal.onclick = () => { 
            themeModal.classList.remove('show'); 
            if (themeOverlay) themeOverlay.classList.remove('show'); 
        };

        const infoModal = document.getElementById('info-modal');
        const btnInfo = document.getElementById('btn-info');
        const infoPillTabs = document.getElementById('info-pill-tabs');
        const infoDetailPanel = document.getElementById('info-detail-panel');
        const btnShowInfo = document.getElementById('btn-show-info');
        const infoBackBtn = document.getElementById('info-back-btn');

        function resetInfoModalView() {
            if (infoPillTabs) infoPillTabs.classList.remove('hidden');
            if (infoDetailPanel) infoDetailPanel.classList.remove('active');
        }

        if (btnInfo && infoModal) {
            btnInfo.onclick = () => { 
                resetInfoModalView();
                infoModal.classList.add('show'); 
                if (themeOverlay) themeOverlay.classList.add('show'); 
            };
        }

        if (btnShowInfo) {
            btnShowInfo.addEventListener('click', (e) => {
                e.preventDefault();
                if (infoPillTabs) infoPillTabs.classList.add('hidden');
                if (infoDetailPanel) infoDetailPanel.classList.add('active');
            });
        }

        if (infoBackBtn) {
            infoBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (infoDetailPanel) infoDetailPanel.classList.remove('active');
                if (infoPillTabs) infoPillTabs.classList.remove('hidden');
            });
        }

        const closeInfoModal = document.getElementById('close-info-modal');
        if (closeInfoModal && infoModal) {
            closeInfoModal.onclick = () => { 
                infoModal.classList.remove('show'); 
                if (themeOverlay) themeOverlay.classList.remove('show');
                resetInfoModalView();
            };
        }

        if (themeOverlay) {
            themeOverlay.onclick = () => { 
                if (themeModal) themeModal.classList.remove('show'); 
                if (infoModal) {
                    infoModal.classList.remove('show');
                    resetInfoModalView();
                }
                themeOverlay.classList.remove('show'); 
            };
        }

        const presetSelect = document.getElementById('val-theme-preset');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                localStorage.setItem('sttv_activePreset', val);
                if (badgePreset) { 
                    badgePreset.classList.add('hidden'); 
                    localStorage.setItem('sttv_presetVersionSeen', String(PRESET_VERSION)); 
                }
                if (val !== 'none') unpackConfig(val);
            });
        }

        function resetPresetToCustom() {
            if (presetSelect) {
                presetSelect.value = 'none';
                localStorage.setItem('sttv_activePreset', 'none');
            }
        }

        const popupAnimSelect = document.getElementById('val-popup-anim');
        if (popupAnimSelect && drawerEl) {
            popupAnimSelect.addEventListener('change', (e) => {
                const animClass = e.target.value;
                drawerEl.className = 'settings-drawer ' + (drawerEl.classList.contains('open') ? 'open ' : '') + (animClass !== 'default' ? animClass : '');
                localStorage.setItem('sttv_popupAnim', animClass);
            });
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx = null;
        function playTick() {
            const toggleAudio = document.getElementById('toggle-audio');
            if (!toggleAudio || !toggleAudio.checked) return;
            try {
                if (!audioCtx) audioCtx = new AudioContext();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator(); 
                const gain = audioCtx.createGain();
                osc.type = 'sine'; 
                osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
                osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.04);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime); 
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
                osc.connect(gain); gain.connect(audioCtx.destination); 
                osc.start(); osc.stop(audioCtx.currentTime + 0.04);
            } catch(e) {}
        }
        document.addEventListener('click', (e) => { 
            if (e.target.tagName === 'BUTTON' || e.target.type === 'checkbox' || e.target.closest('.theme-chip') || e.target.closest('.theme-chip-more')) playTick(); 
        });

        if (drawerEl) {
            drawerEl.addEventListener('change', (e) => {
                if (e.target.type === 'color' || e.target.type === 'checkbox') {
                    updateLiveVariables(true); 
                }
            });
            drawerEl.addEventListener('input', (e) => {
                if (e.target && e.target.type === 'color') e.stopPropagation();
            }, true);
        }

        document.querySelectorAll('.shadow-switch').forEach(switchBtn => {
            switchBtn.addEventListener('change', (e) => {
                const drawer = document.getElementById(`drawer-${e.target.value}`);
                if (drawer) {
                    if (e.target.checked) drawer.classList.add('active'); 
                    else drawer.classList.remove('active');
                }
                resetPresetToCustom(); 
                updateLiveVariables(true);
            });
        });

        function handleOrientation(e) {
            const tp = document.getElementById('toggle-parallax');
            if (!tp || !tp.checked) return;
            let x = e.gamma; let y = e.beta; 
            if (x > 45) x = 45; if (x < -45) x = -45;
            if (y > 45) y = 45; if (y < -45) y = -45;
            root.style.setProperty('--tilt-x', (x / 10) + 'px'); 
            root.style.setProperty('--tilt-y', (y / 10) + 'px');
        }

        const toggleParallaxEl = document.getElementById('toggle-parallax');
        if (toggleParallaxEl) {
            toggleParallaxEl.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                        DeviceOrientationEvent.requestPermission().then(state => {
                            if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
                            else { e.target.checked = false; alert('Vui lòng cấp quyền cảm biến!'); }
                        }).catch(console.error);
                    } else { window.addEventListener('deviceorientation', handleOrientation); }
                } else {
                    window.removeEventListener('deviceorientation', handleOrientation);
                    root.style.setProperty('--tilt-x', '0px'); 
                    root.style.setProperty('--tilt-y', '0px');
                }
                localStorage.setItem('sttv_parallax', e.target.checked);
            });
        }

        const uploadBg = document.getElementById('upload-bg');
        const fileDisplay = document.getElementById('file-name-display');
        function updateFileNameDisplay(fileName) {
            if (!fileDisplay) return;
            const prefix = (window.i18nData && window.i18nData['file_selected_prefix']) || 'Đã chọn: ';
            const emptyText = (window.i18nData && window.i18nData['file_none_selected']) || 'Chưa chọn tệp nào';
            if (fileName) {
                fileDisplay.textContent = prefix + fileName;
                fileDisplay.classList.add('has-file');
            } else {
                fileDisplay.textContent = emptyText;
                fileDisplay.classList.remove('has-file');
            }
        }
        
        if (uploadBg) {
            uploadBg.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    updateFileNameDisplay(file.name);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const b64 = ev.target.result; 
                        localStorage.setItem('sttv_customBgImage', b64);
                        root.style.setProperty('--bg-image', `url('${b64}')`);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        const clearBgBtn = document.getElementById('clear-bg');
        if (clearBgBtn) {
            clearBgBtn.addEventListener('click', () => { 
                localStorage.removeItem('sttv_customBgImage'); 
                root.style.setProperty('--bg-image', 'none'); 
                if (uploadBg) uploadBg.value = ""; 
                updateFileNameDisplay(null);
            });
        }

        let adjustTimeout;
        if (drawerEl) {
            drawerEl.addEventListener('input', (e) => {
                if (e.target.tagName === 'INPUT' && e.target.type === 'range') {
                    drawerEl.classList.add('adjusting'); 
                    clearTimeout(adjustTimeout);
                    adjustTimeout = setTimeout(() => drawerEl.classList.remove('adjusting'), 800);
                }
            });
        }

        function setLayoutMode(mode) { localStorage.setItem('sttv_layoutMode', mode); updateLiveVariables(true); }
        const btnLayoutList = document.getElementById('btn-layout-list');
        const btnLayoutGrid = document.getElementById('btn-layout-grid');
        if (btnLayoutList) btnLayoutList.onclick = () => { setLayoutMode('list'); resetPresetToCustom(); }; 
        if (btnLayoutGrid) btnLayoutGrid.onclick = () => { setLayoutMode('grid'); resetPresetToCustom(); };

        // ==========================================
        // 5. CÁC HÀM XỬ LÝ MÀU VÀ ĐỔ BÓNG
        // ==========================================
        function hexToRgba(hex, alpha) {
            let r = 0, g = 0, b = 0;
            if (!hex) return `rgba(0,0,0,${alpha / 100})`;
            if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
            else if (hex.length === 7) { r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16); }
            return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
        }
        function hexToRgb(hex) {
            let r = 0, g = 0, b = 0;
            if (!hex) return '0,0,0';
            if (hex.length === 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); }
            else if (hex.length === 7) { r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16); }
            return `${r}, ${g}, ${b}`;
        }

        function updateShadow() {
            const activeShadows = document.querySelectorAll('input[name="active_shadow"]:checked');
            let combinedShadow = '';
            activeShadows.forEach(checkbox => {
                try {
                    const drawer = document.getElementById(`drawer-${checkbox.value}`);
                    if (!drawer) return;
                    const mode = SHADOW_MODES.find(m => m.id === checkbox.value);
                    if (!mode || !mode.template) return;
                    
                    const colorEl = drawer.querySelector('.s-c');
                    const opacityEl = drawer.querySelector('.s-o');
                    if (!colorEl || !opacityEl) return;
                    
                    const rgbaColor = hexToRgba(colorEl.value, opacityEl.value);
                    let shadowStr = mode.template
                        .replace(/{x}/g, drawer.querySelector('.s-x').value)
                        .replace(/{y}/g, drawer.querySelector('.s-y').value)
                        .replace(/{b}/g, drawer.querySelector('.s-b').value)
                        .replace(/{s}/g, drawer.querySelector('.s-s').value)
                        .replace(/{c}/g, rgbaColor);
                    if (combinedShadow) combinedShadow += ', '; 
                    combinedShadow += shadowStr;
                } catch(err) {
                    console.warn('Shadow mode error:', err);
                }
            });
            root.style.setProperty('--btn-shadow', combinedShadow || 'none');
        }

        // ==========================================
        // 6. XUẤT / NHẬP / LƯU TRỮ LOCALSTORAGE
        // ==========================================
        function g(id) { const el = document.getElementById(id); return el ? el.value : ''; }
        function c(id) { const el = document.getElementById(id); return el ? el.checked : false; }

        // BẢNG MAP ID VÀ LOCALSTORAGE (Phải khớp chính xác HTML mới nhất)
        const KEYS = [
            { id: 'val-bg-main', key: 'bgMain' },
            { id: 'val-text-color', key: 'textColor' },
            { id: 'val-list-bg', key: 'listBg' },
            { id: 'val-list-bg-opacity', key: 'listBgOpacity' },
            { id: 'val-list-text', key: 'listText' },
            { id: 'val-list-svg', key: 'listSvg' },
            { id: 'val-theme-frame', key: 'themeFrame' },
            { id: 'val-frame-size', key: 'frameSize' },
            { id: 'val-svg-size', key: 'svgSize' },
            { id: 'val-svg-opacity', key: 'svgOpacity' },
            { id: 'val-frame-radius', key: 'frameRadius' },
            { id: 'val-frame-color', key: 'frameColor' },
            { id: 'val-frame-bg-opacity', key: 'frameBgOpacity' },
            { id: 'val-svg-color', key: 'svgColor' },
            { id: 'toggle-hide-labels', key: 'hideLabels', isCheck: true },
            { id: 'toggle-list-frame', key: 'listFrame', isCheck: true },
            { id: 'val-title-size', key: 'titleSize' },
            { id: 'val-title-spacing', key: 'titleSpacing' },
            { id: 'val-icon-spacing', key: 'iconSpacing' },
            { id: 'toggle-glass', key: 'glassMode', isCheck: true },
            { id: 'toggle-audio', key: 'audioFeedback', isCheck: true },
            { id: 'val-media-width', key: 'mediaWidth' },
            { id: 'val-media-bg-opacity', key: 'mediaBgOpacity' },
            { id: 'val-media-btn-size', key: 'mediaBtnSize' },
            { id: 'val-media-bg-color', key: 'mediaBgColor' },
            { id: 'val-media-btn-color', key: 'mediaBtnColor' },
            { id: 'val-media-svg-color', key: 'mediaSvgColor' },
            { id: 'toggle-media-theme', key: 'mediaThemeSync', isCheck: true },
            { id: 'toggle-theme-dot', key: 'themeDot', isCheck: true },
            { id: 'val-thumb-size', key: 'thumbSize' },
            { id: 'val-thumb-color', key: 'thumbColor' },
            { id: 'val-thumb-theme', key: 'thumbTheme' }
        ];

        function saveSettingsToLocal() {
            try {
                KEYS.forEach(item => {
                    const el = document.getElementById(item.id);
                    if (el) localStorage.setItem('sttv_' + item.key, item.isCheck ? el.checked : el.value);
                });

                const shadowState = {};
                SHADOW_MODES.forEach(mode => {
                    const drawer = document.getElementById(`drawer-${mode.id}`);
                    const checkbox = document.querySelector(`input[name="active_shadow"][value="${mode.id}"]`);
                    if (drawer && checkbox) {
                        shadowState[mode.id] = {
                            active: checkbox.checked, x: drawer.querySelector('.s-x').value, y: drawer.querySelector('.s-y').value,
                            b: drawer.querySelector('.s-b').value, s: drawer.querySelector('.s-s').value,
                            c: drawer.querySelector('.s-c').value, o: drawer.querySelector('.s-o').value
                        };
                    }
                });
                localStorage.setItem('sttv_shadowConfig', JSON.stringify(shadowState));
            } catch(e) { console.warn('save failed:', e); }
        }

        function packConfig() {
            const shadowArr = [];
            SHADOW_MODES.forEach(mode => {
                const drawer = document.getElementById(`drawer-${mode.id}`);
                const checkbox = document.querySelector(`input[name="active_shadow"][value="${mode.id}"]`);
                if (drawer && checkbox && checkbox.checked) {
                    shadowArr.push([
                        mode.id, drawer.querySelector('.s-x').value, drawer.querySelector('.s-y').value,
                        drawer.querySelector('.s-b').value, drawer.querySelector('.s-s').value,
                        drawer.querySelector('.s-c').value, drawer.querySelector('.s-o').value
                    ].join('*'));
                }
            });

            // Gói dữ liệu theo chuẩn mảng (Giữ đúng Index để unpack không bị lệch)
            const configValues = [
                g('val-bg-main'), g('val-text-color'), localStorage.getItem('sttv_layoutMode') || 'grid', 
                g('val-list-bg'), g('val-list-text'), g('val-list-svg'), g('val-theme-frame'), 
                g('val-frame-size'), g('val-svg-size'), g('val-svg-opacity'), g('val-frame-radius'), 
                g('val-frame-color'), g('val-svg-color'), c('toggle-hide-labels') ? 1 : 0, 
                g('val-title-size'), g('val-title-spacing'), c('toggle-list-frame') ? 1 : 0, 
                g('val-icon-spacing'), g('val-list-bg-opacity'), g('val-frame-bg-opacity'), 
                g('val-media-width'), g('val-media-bg-opacity'), g('val-media-btn-size'), 
                g('val-media-bg-color'), g('val-media-btn-color'), g('val-media-svg-color'), 
                c('toggle-glass') ? 1 : 0, g('val-popup-anim'), shadowArr.join('~'), 
                c('toggle-media-theme') ? 1 : 0, c('toggle-theme-dot') ? 1 : 0, g('val-thumb-size'), 
                g('val-thumb-color'), g('val-thumb-theme')
            ];
            return encodeURIComponent(configValues.join('|'));
        }

        function unpackConfig(code) {
            if (!code) return;
            try {
                if (drawerEl) drawerEl.classList.remove('adjusting'); 
                localStorage.removeItem('sttv_customBgImage');
                root.style.setProperty('--bg-image', 'none');
                if (uploadBg) uploadBg.value = "";
                
                const decoded = decodeURIComponent(code.trim());
                const data = decoded.split('|');
                if (data.length < 28) { alert("Mã cấu hình không hợp lệ!"); return; }
                
                const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
                const setC = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
                
                setV('val-bg-main', data[0]); setV('val-text-color', data[1]); setLayoutMode(data[2]); 
                setV('val-list-bg', data[3]); setV('val-list-text', data[4]); setV('val-list-svg', data[5]); 
                setV('val-theme-frame', data[6]); setV('val-frame-size', data[7]); setV('val-svg-size', data[8]); 
                setV('val-svg-opacity', data[9]); setV('val-frame-radius', data[10]); setV('val-frame-color', data[11]); 
                setV('val-svg-color', data[12]); setC('toggle-hide-labels', data[13] === '1'); setV('val-title-size', data[14]); 
                setV('val-title-spacing', data[15]); setC('toggle-list-frame', data[16] === '1'); 
                setV('val-icon-spacing', data[17]); setV('val-list-bg-opacity', data[18]); setV('val-frame-bg-opacity', data[19]); 
                setV('val-media-width', data[20]); setV('val-media-bg-opacity', data[21]); setV('val-media-btn-size', data[22]); 
                setV('val-media-bg-color', data[23]); setV('val-media-btn-color', data[24]); setV('val-media-svg-color', data[25]); 
                setC('toggle-glass', data[26] === '1'); setV('val-popup-anim', data[27]);
                
                document.querySelectorAll('.shadow-switch').forEach(chk => { 
                    chk.checked = false; 
                    const drw = document.getElementById(`drawer-${chk.value}`); 
                    if (drw) drw.classList.remove('active'); 
                });

                if (data[28]) {
                    const shadows = data[28].split('~');
                    shadows.forEach(sh => {
                        const p = sh.split('*');
                        if (p.length > 1) {
                            const sId = p[0]; 
                            const shadowSwitch = document.querySelector(`input[name="active_shadow"][value="${sId}"]`);
                            if (shadowSwitch) {
                                shadowSwitch.checked = true; 
                                const drw = document.getElementById(`drawer-${sId}`); 
                                if (drw) {
                                    drw.classList.add('active');
                                    drw.querySelector('.s-x').value = p[1]; drw.querySelector('.s-y').value = p[2];
                                    drw.querySelector('.s-b').value = p[3]; drw.querySelector('.s-s').value = p[4]; 
                                    drw.querySelector('.s-c').value = p[5]; if (p[6]) drw.querySelector('.s-o').value = p[6];
                                }
                            }
                        }
                    });
                }

                if (data[29] !== undefined) setC('toggle-media-theme', data[29] === '1');
                if (data[30] !== undefined) setC('toggle-theme-dot', data[30] === '1'); else setC('toggle-theme-dot', true);
                if (data[31] !== undefined) setV('val-thumb-size', data[31]);
                if (data[32] !== undefined) setV('val-thumb-color', data[32]);
                if (data[33] !== undefined) setV('val-thumb-theme', data[33]);

                updateLiveVariables(true);
            } catch(e) { console.error(e); alert("Lỗi đọc mã cấu hình! Vui lòng thử lại."); }
        }

        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', (e) => { 
                e.preventDefault(); 
                const code = packConfig();
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(code).then(() => { alert("Đã sao chép mã cấu hình thành công!"); })
                    .catch(() => { prompt("Sao chép mã cấu hình bên dưới:", code); });
                } else { prompt("Sao chép mã cấu hình bên dưới:", code); }
            });
        }

        const btnImport = document.getElementById('btn-import');
        if (btnImport) {
            btnImport.addEventListener('click', (e) => { 
                e.preventDefault(); 
                const code = prompt("📥 Dán mã cấu hình vào đây:"); 
                if (code) { unpackConfig(code); resetPresetToCustom(); } 
            });
        }

        const btnResetDefault = document.getElementById('btn-reset-default');
        if (btnResetDefault) {
            btnResetDefault.addEventListener('click', (e) => {
                e.preventDefault();
                const ok = confirm('⚠️ KHÔI PHỤC MẶC ĐỊNH\n\nXóa toàn bộ cấu hình, hình nền và theme. Hành động này không thể hoàn tác. Bạn chắc chắn?');
                if (!ok) return;

                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('sttv_')) keysToRemove.push(key);
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                setTimeout(() => { location.reload(); }, 150);
            });
        }

        // ==========================================
        // 7. HÀM CẬP NHẬT CSS VARIABLES (LÕI CỦA UI)
        // ==========================================
        function updateLiveVariables(saveNow = false) {
            root.style.setProperty('--bg-main', g('val-bg-main'));
            
            // Xử lý màu chữ cho Grid và List riêng biệt
            const isList = (localStorage.getItem('sttv_layoutMode') || 'grid') === 'list';
            root.style.setProperty('--text-color', isList ? g('val-list-text') : g('val-text-color'));
            
            root.style.setProperty('--frame-size', g('val-frame-size') + 'px');
            root.style.setProperty('--svg-size', g('val-svg-size') + 'px');
            root.style.setProperty('--svg-color', g('val-svg-color'));
            root.style.setProperty('--svg-opacity', g('val-svg-opacity') / 100);
            
            const rawRadius = g('val-frame-radius');
            root.style.setProperty('--frame-border-radius', rawRadius + '%'); 
            root.style.setProperty('--list-border-radius', rawRadius + 'px'); 

            root.style.setProperty('--title-size', g('val-title-size') + 'px');
            root.style.setProperty('--title-spacing', g('val-title-spacing') + 'px');
            root.style.setProperty('--icon-spacing', g('val-icon-spacing') + 'px');
            root.style.setProperty('--label-display', c('toggle-hide-labels') ? 'none' : 'block');
            
            if (btnLayoutList && btnLayoutGrid && mainContainer) {
                if (isList) { 
                    btnLayoutList.classList.add('active'); btnLayoutGrid.classList.remove('active'); 
                    mainContainer.classList.add('list-mode'); mainContainer.classList.remove('grid-mode'); 
                } else { 
                    btnLayoutGrid.classList.add('active'); btnLayoutList.classList.remove('active'); 
                    mainContainer.classList.add('grid-mode'); mainContainer.classList.remove('list-mode'); 
                }
            }

            if (mainContainer) {
                if (c('toggle-list-frame')) mainContainer.classList.add('list-frame-active'); 
                else mainContainer.classList.remove('list-frame-active');
            }

            const listBgHex = g('val-list-bg');
            const listBgOpacity = g('val-list-bg-opacity');
            root.style.setProperty('--list-bg-color', listBgHex); 
            root.style.setProperty('--list-bg-rgba', hexToRgba(listBgHex, listBgOpacity)); 
            root.style.setProperty('--list-text-color', g('val-list-text'));
            root.style.setProperty('--list-svg-color', g('val-list-svg'));

            const frameSelect = g('val-theme-frame');
            const frameColorRgba = hexToRgba(g('val-frame-color'), g('val-frame-bg-opacity'));
            if (frameSelect === 'none' || !frameSelect) { 
                root.style.setProperty('--frame-bg', 'none'); 
                root.style.setProperty('--frame-bg-color', frameColorRgba); 
            } else { 
                root.style.setProperty('--frame-bg', `url('../${frameSelect}')`); 
                root.style.setProperty('--frame-bg-color', 'transparent'); 
            }
            
            if (mainContainer) {
                if (c('toggle-glass')) mainContainer.classList.add('glass-active'); 
                else mainContainer.classList.remove('glass-active');
            }

            root.style.setProperty('--media-bg-rgb', hexToRgb(g('val-media-bg-color')));
            root.style.setProperty('--media-bg-opacity', g('val-media-bg-opacity') / 100);
            root.style.setProperty('--media-width', g('val-media-width') + '%');
            root.style.setProperty('--media-btn-color', g('val-media-btn-color'));
            root.style.setProperty('--media-svg-color', g('val-media-svg-color'));
            const mediaBtnSize = g('val-media-btn-size');
            root.style.setProperty('--media-btn-size', mediaBtnSize + 'px');
            root.style.setProperty('--media-btn-play', (parseInt(mediaBtnSize) + 15) + 'px');

            root.style.setProperty('--thumb-size', g('val-thumb-size') + 'px');
            root.style.setProperty('--thumb-color', g('val-thumb-color'));
            const thumbThemeSelect = g('val-thumb-theme');
            if (thumbThemeSelect === 'none') root.style.setProperty('--thumb-bg-image', "url('../Theme/icon-dot.png')");
            else root.style.setProperty('--thumb-bg-image', `url('../${thumbThemeSelect}')`);

            const toggleMediaTheme = document.getElementById('toggle-media-theme');
            const toggleThemeDot = document.getElementById('toggle-theme-dot');
            const btnThumbThemeEl = document.getElementById('btn-thumb-theme');
            const thumbColorEl = document.getElementById('val-thumb-color');
            const thumbColorItem = thumbColorEl ? thumbColorEl.parentElement : null;
            const mediaWidget = document.querySelector('.media-player-widget');
            
            if (mediaWidget) {
                if (toggleMediaTheme && toggleMediaTheme.checked) mediaWidget.classList.add('theme-synced');
                else mediaWidget.classList.remove('theme-synced');

                if (toggleThemeDot && toggleThemeDot.checked) {
                    mediaWidget.classList.remove('pure-css-dots');
                    if (btnThumbThemeEl) btnThumbThemeEl.classList.remove('disabled');
                    if (thumbColorItem) { thumbColorItem.style.opacity = '0.5'; thumbColorItem.style.pointerEvents = 'none'; }
                } else {
                    mediaWidget.classList.add('pure-css-dots');
                    if (btnThumbThemeEl) btnThumbThemeEl.classList.add('disabled');
                    if (thumbColorItem) { thumbColorItem.style.opacity = '1'; thumbColorItem.style.pointerEvents = 'auto'; }
                }
            }

            updateShadow();
            if (saveNow) saveSettingsToLocal();
        }

        function loadSettingsFromLocal() {
            KEYS.forEach(item => {
                const el = document.getElementById(item.id);
                if (!el) return;
                const val = localStorage.getItem('sttv_' + item.key);
                if (item.isCheck) el.checked = val === 'true' ? true : (val === null ? (el.hasAttribute('checked') ? true : false) : false);
                else el.value = val !== null ? val : el.defaultValue || el.getAttribute('value');
            });
            
            // Xử lý riêng cho các thẻ select
            const vtf = document.getElementById('val-theme-frame');
            if (vtf) vtf.value = localStorage.getItem('sttv_themeFrame') || 'none';
            const presetSelect = document.getElementById('val-theme-preset');
            if (presetSelect) presetSelect.value = localStorage.getItem('sttv_activePreset') || 'none';
            const popupAnimSelect = document.getElementById('val-popup-anim');
            if (popupAnimSelect) {
                const savedAnim = localStorage.getItem('sttv_popupAnim') || 'default';
                popupAnimSelect.value = savedAnim;
                if (savedAnim !== 'default' && drawerEl) drawerEl.classList.add(savedAnim);
            }
            const vtt = document.getElementById('val-thumb-theme');
            if (vtt) vtt.value = localStorage.getItem('sttv_thumbTheme') || 'none';

            const savedShadowConfig = localStorage.getItem('sttv_shadowConfig');
            if (savedShadowConfig) {
                try {
                    const shadowState = JSON.parse(savedShadowConfig);
                    SHADOW_MODES.forEach(mode => {
                        if (shadowState[mode.id]) {
                            const item = shadowState[mode.id];
                            const checkbox = document.querySelector(`input[name="active_shadow"][value="${mode.id}"]`);
                            const drawer = document.getElementById(`drawer-${mode.id}`);
                            if (checkbox && drawer) {
                                checkbox.checked = item.active;
                                if (item.active) drawer.classList.add('active'); else drawer.classList.remove('active');
                                drawer.querySelector('.s-x').value = item.x; drawer.querySelector('.s-y').value = item.y;
                                drawer.querySelector('.s-b').value = item.b; drawer.querySelector('.s-s').value = item.s;
                                drawer.querySelector('.s-c').value = item.c; drawer.querySelector('.s-o').value = item.o;
                            }
                        }
                    });
                } catch(e) {}
            }

            const savedBg = localStorage.getItem('sttv_customBgImage'); 
            if (savedBg) root.style.setProperty('--bg-image', `url('${savedBg}')`);
        }

        loadSettingsFromLocal();
        updateLiveVariables(true);

        document.addEventListener("visibilitychange", () => { 
            if (document.visibilityState === 'hidden') saveSettingsToLocal(); 
        });
        window.addEventListener("beforeunload", saveSettingsToLocal);
    } catch(err) {
        console.error('Theme.js crashed:', err);
    }
});