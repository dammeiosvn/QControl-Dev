const SUPPORTED_LANGS = [
    'ar', 'bn-BD', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-GB', 'en-US', 
    'es-ES', 'es-MX', 'fa-IR', 'fi-FI', 'fil-PH', 'fr-CA', 'fr-FR', 'hi-IN', 
    'hu-HU', 'id-ID', 'it-IT', 'ja', 'ko-KR', 'ms-MY', 'nb-NO', 'nl-NL', 
    'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'ru', 'sv-SE', 'sw-KE', 'th-TH', 
    'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-TW'
];

/* ⭐ FIX: match mềm — "vi" sẽ tự khớp "vi-VN", "en" khớp "en-US", v.v. */
function findBestLang(rawLang) {
    if (!rawLang) return 'en-US';
    if (SUPPORTED_LANGS.includes(rawLang)) return rawLang;
    const lower = rawLang.toLowerCase();
    const exact = SUPPORTED_LANGS.find(l => l.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split('-')[0];
    const baseMatch = SUPPORTED_LANGS.find(l => l.toLowerCase().startsWith(base + '-'));
    if (baseMatch) return baseMatch;
    return 'en-US';
}

function safeSetItem(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (e) { console.warn('localStorage.setItem failed:', key, e); return false; }
}
function safeGetItem(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}

document.addEventListener("DOMContentLoaded", async () => {
    const rawLang = navigator.language || navigator.userLanguage || 'en-US';
    const userLang = findBestLang(rawLang);
    console.log('[i18n] rawLang =', rawLang, '| resolved =', userLang);

    const RTL_LANGS = ['ar', 'fa-IR', 'he'];
    if (RTL_LANGS.includes(userLang.split('-')[0]) || RTL_LANGS.includes(userLang)) {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }

    async function fetchWithCaseFallback(url1, url2) {
        try {
            let res = await fetch(url1);
            if (res.ok) return await res.json();
        } catch (e) {}
        try {
            let res2 = await fetch(url2);
            if (res2.ok) return await res2.json();
        } catch (e) {}
        return null;
    }

    const fallbackTranslations = await fetchWithCaseFallback(`Language/en-US.json`, `language/en-US.json`) || {};
    const userTranslations = await fetchWithCaseFallback(`Language/${userLang}.json`, `language/${userLang}.json`) || {};

    // Merge: vi-VN ghi đè en-US, en-US ghi đè rỗng
    window.i18nData = { ...fallbackTranslations, ...userTranslations };
    console.log('[i18n] loaded keys:', Object.keys(window.i18nData).length);

    function applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (window.i18nData[key]) element.innerText = window.i18nData[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (window.i18nData[key]) element.placeholder = window.i18nData[key];
        });
    }
    applyI18n();
    window.applyI18n = applyI18n;

    try {
        const data = await fetchWithCaseFallback('Data/data.json', 'data/data.json');
        if (!data || !data.buttons) {
            console.error("Không tải được Data/data.json");
            return;
        }

        const container = document.getElementById('control-panel');
        if (!container) return;

        /* ============================================================
           RENDER ICON TỪ DATA.JSON + KHÔI PHỤC THỨ TỰ ĐÃ LƯU
           ============================================================ */
        let renderArray = data.buttons;
        const savedOrder = safeGetItem('sttv_iconOrder');
        if (savedOrder) {
            try {
                const orderIds = JSON.parse(savedOrder);
                renderArray = orderIds.map(id => data.buttons.find(b => b.id === id)).filter(b => b !== undefined);
                data.buttons.forEach(b => { if (!renderArray.includes(b)) renderArray.push(b); });
            } catch (e) {
                console.warn('Lỗi parse sttv_iconOrder:', e);
                renderArray = data.buttons;
            }
        }

        if (renderArray && renderArray.length > 0) {
            renderArray.forEach(item => {
                const btn = document.createElement('a');
                btn.className = 'glass-btn';
                btn.href = item.action || '#';
                btn.dataset.id = item.id;

                // ⭐ FIX: ưu tiên i18n, fallback title gốc, cuối cùng là "Phím tắt"
                const localizedTitle = window.i18nData[item.title_key]
                    || item.title
                    || 'Phím tắt';

                btn.innerHTML = `<div class="icon-box">${item.svg || ''}</div><span class="label">${localizedTitle}</span>`;
                container.appendChild(btn);
            });
        }

        /* ============================================================
           ⭐ SORT MODE — Bản mới
           - Bấm "Sắp xếp" → đóng popup cài đặt → bật edit mode
           - Nút ✔️ hiện ra, xám khi chưa chọn, xanh khi có icon được chọn
           - Chọn icon → phát sáng xanh + dấu ✓ trong khung tròn
           - Bấm ✔️ → thoát, lưu thứ tự, ẩn nút
           ============================================================ */
        const btnEditLayout = document.getElementById('btn-edit-layout');
        const sortFab = document.getElementById('btn-confirm-sort');
        let editMode = false;
        let selectedSwapNode = null;

        function blockNav(e) {
            if (editMode) e.preventDefault();
        }

        function enterEditMode() {
            if (editMode) return;
            editMode = true;
            document.body.classList.add('edit-mode');
            if (sortFab) sortFab.classList.remove('hidden');

            // Block click mở shortcut khi đang sắp xếp
            container.querySelectorAll('.glass-btn').forEach(b => {
                b.addEventListener('click', blockNav, true);
            });
        }

        function exitEditMode() {
            if (!editMode) return;
            editMode = false;
            document.body.classList.remove('edit-mode');

            if (sortFab) {
                sortFab.classList.add('hidden');
                sortFab.classList.remove('active');
            }

            if (selectedSwapNode) {
                selectedSwapNode.classList.remove('selected-swap');
                selectedSwapNode = null;
            }

            // Gỡ listener block
            container.querySelectorAll('.glass-btn').forEach(b => {
                b.removeEventListener('click', blockNav, true);
            });

            // Lưu thứ tự mới
            const newOrder = Array.from(container.querySelectorAll('.glass-btn')).map(b => b.dataset.id);
            safeSetItem('sttv_iconOrder', JSON.stringify(newOrder));
        }

        if (btnEditLayout) {
            btnEditLayout.addEventListener('click', (e) => {
                e.preventDefault();

                // ⭐ Đóng popup cài đặt trước khi vào chế độ sắp xếp
                if (typeof window.__closeSettings === 'function') {
                    window.__closeSettings();
                } else {
                    const d = document.getElementById('settings-drawer');
                    const o = document.getElementById('settings-overlay');
                    if (d) d.classList.remove('open');
                    if (o) o.classList.remove('open');
                }

                // Delay nhỏ để drawer đóng mượt rồi mới bật edit mode
                setTimeout(enterEditMode, 220);
            });
        }

        if (sortFab) {
            sortFab.addEventListener('click', (e) => {
                e.preventDefault();
                exitEditMode();
            });
        }

        container.addEventListener('click', (e) => {
            if (!editMode) return;
            const target = e.target.closest('.glass-btn');
            if (!target) return;
            e.preventDefault();

            if (!selectedSwapNode) {
                // Chọn icon đầu tiên
                selectedSwapNode = target;
                target.classList.add('selected-swap');
                if (sortFab) sortFab.classList.add('active');
            } else if (selectedSwapNode === target) {
                // Bỏ chọn chính nó
                target.classList.remove('selected-swap');
                selectedSwapNode = null;
                if (sortFab) sortFab.classList.remove('active');
            } else {
                // Hoán đổi vị trí 2 icon
                const temp = document.createElement('div');
                target.parentNode.insertBefore(temp, target);
                selectedSwapNode.parentNode.insertBefore(target, selectedSwapNode);
                temp.parentNode.insertBefore(selectedSwapNode, temp);
                temp.parentNode.removeChild(temp);

                selectedSwapNode.classList.remove('selected-swap');
                selectedSwapNode = null;
                if (sortFab) sortFab.classList.remove('active');
                // Chưa lưu — đợi user bấm ✔️ xác nhận
            }
        });

        /* ============================================================
           OBSERVER — cập nhật i18n cho icon render động
           ============================================================ */
        const observer = new MutationObserver(() => {
            document.querySelectorAll('#control-panel [data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (window.i18nData[key]) element.innerText = window.i18nData[key];
            });
        });
        observer.observe(container, { childList: true, subtree: true });

    } catch (e) {
        console.error("Lỗi quá trình tải:", e);
    }
});