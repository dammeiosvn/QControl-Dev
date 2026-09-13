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

                // ⭐ FIX: ưu tiên vi-VN, nếu không có thì thử en-US, cuối cùng là "Phím tắt"
                const localizedTitle = window.i18nData[item.title_key]
                    || item.title
                    || 'Phím tắt';

                btn.innerHTML = `<div class="icon-box">${item.svg || ''}</div><span class="label">${localizedTitle}</span>`;
                container.appendChild(btn);
            });
        }

        const btnEditLayout = document.getElementById('btn-edit-layout');
        let editMode = false;
        let selectedSwapNode = null;

        if (btnEditLayout) {
            btnEditLayout.addEventListener('click', () => {
                editMode = !editMode;
                document.body.classList.toggle('edit-mode', editMode);
                btnEditLayout.style.background = editMode ? 'red' : '';

                const editLabel = window.i18nData?.['btn_edit_layout'] || 'Sắp xếp';
                btnEditLayout.innerHTML = editMode ? 'Xong' : `🔄 <span>${editLabel}</span>`;

                if (!editMode && selectedSwapNode) {
                    selectedSwapNode.classList.remove('selected-swap');
                    selectedSwapNode = null;
                }
                document.querySelectorAll('.glass-btn').forEach(b => {
                    b.onclick = editMode ? (e) => e.preventDefault() : null;
                });
            });
        }

        container.addEventListener('click', (e) => {
            if (!editMode) return;
            const target = e.target.closest('.glass-btn');
            if (!target) return;

            if (!selectedSwapNode) {
                selectedSwapNode = target;
                target.classList.add('selected-swap');
            } else if (selectedSwapNode === target) {
                target.classList.remove('selected-swap');
                selectedSwapNode = null;
            } else {
                const temp = document.createElement('div');
                target.parentNode.insertBefore(temp, target);
                selectedSwapNode.parentNode.insertBefore(target, selectedSwapNode);
                temp.parentNode.insertBefore(selectedSwapNode, temp);
                temp.parentNode.removeChild(temp);

                selectedSwapNode.classList.remove('selected-swap');
                selectedSwapNode = null;

                const newOrder = Array.from(container.querySelectorAll('.glass-btn')).map(b => b.dataset.id);
                safeSetItem('sttv_iconOrder', JSON.stringify(newOrder));
            }
        });

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