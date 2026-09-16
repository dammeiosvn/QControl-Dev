// ==========================================
// 1. CẤU HÌNH NGÔN NGỮ & HÀM BỔ TRỢ
// ==========================================
const SUPPORTED_LANGS = [
    'ar', 'bn-BD', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-GB', 'en-US', 
    'es-ES', 'es-MX', 'fa-IR', 'fi-FI', 'fil-PH', 'fr-CA', 'fr-FR', 'hi-IN', 
    'hu-HU', 'id-ID', 'it-IT', 'ja', 'ko-KR', 'ms-MY', 'nb-NO', 'nl-NL', 
    'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'ru', 'sv-SE', 'sw-KE', 'th-TH', 
    'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-TW'
];

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

// ==========================================
// 2. DỮ LIỆU DỰ PHÒNG (TRÁNH LỖI TRẮNG TRANG)
// ==========================================
const FALLBACK_SHORTCUTS = [
    { id: 'wifi', title_key: 'btn_wifi', title: 'Wi-Fi', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=wifi', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 21c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-4.6-4.6c2.5-2.5 6.6-2.5 9.2 0l1.4-1.4c-3.3-3.3-8.6-3.3-11.9 0l1.3 1.4zm-4.3-4.3c4.9-4.9 12.8-4.9 17.7 0l1.4-1.4c-5.7-5.7-14.9-5.7-20.5 0l1.4 1.4zm-4.2-4.2c7.2-7.2 19-7.2 26.2 0l1.4-1.4C19.1 1.9 4.9 1.9-2.3 9.1l1.4 1.4z"/></svg>' },
    { id: 'bluetooth', title_key: 'btn_bluetooth', title: 'Bluetooth', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=bluetooth', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg>' },
    { id: 'airplane', title_key: 'btn_airplane', title: 'Máy bay', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=airplane', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>' },
    { id: 'cellular', title_key: 'btn_cellular', title: 'Di động', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=cellular', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 11v9h2v-9h-2zm-4 4v5h2v-5H8zm8-8v13h2V7h-2zm4-4v17h2V3h-2zM4 19h2v-2H4v2z"/></svg>' },
    { id: 'vpn', title_key: 'btn_vpn', title: 'VPN', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=vpn', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' },
    { id: 'dnd', title_key: 'btn_dnd', title: 'Tập trung', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=dnd', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>' },
    { id: 'hotspot', title_key: 'btn_hotspot', title: 'Phát Wi-Fi', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=hotspot', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-14c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>' },
    { id: 'respring', title_key: 'btn_respring', title: 'Làm mới', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=respring', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>' },
    { id: 'power', title_key: 'btn_power', title: 'Nguồn', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=power', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>' },
    { id: 'flashlight', title_key: 'btn_flashlight', title: 'Đèn pin', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=flashlight', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M9 21h6v-9H9v9zm3-19C9.24 2 7 4.24 7 7c0 1.25.46 2.4 1.21 3.28L9 11.08V12h6v-.92l.79-.8C16.54 9.4 17 8.25 17 7c0-2.76-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/></svg>' },
    { id: 'assistive', title_key: 'btn_assistive', title: 'Trợ năng', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=assistive', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' },
    { id: 'location', title_key: 'btn_location', title: 'Vị trí', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=location', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' },
    { id: 'silent', title_key: 'btn_silent', title: 'Im lặng', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=silent', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' },
    { id: 'lowpower', title_key: 'btn_lowpower', title: 'Pin yếu', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=lowpower', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/></svg>' },
    { id: 'airdrop', title_key: 'btn_airdrop', title: 'AirDrop', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=airdrop', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2L4.5 9h5v6h5V9h5L12 2zm-7 14v4h14v-4h2v6H3v-6h2z"/></svg>' },
    { id: 'rotation', title_key: 'btn_rotation', title: 'Khóa xoay', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=rotation', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l12.02 12.02c.59.59 1.54.59 2.12 0l6.36-6.36c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.6 19.44L2.81 9.17l6.36-6.36 12.02 12.02-6.36 6.36zm-7.31.29C4.25 19.94 1.91 16.76 1.55 13H.05C.56 19.16 5.71 24 12 24l.66-.03-3.81-3.81-1.33 1.32z"/></svg>' },
    { id: 'screenshot', title_key: 'btn_screenshot', title: 'Ảnh màn hình', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=screenshot', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v14H5V5zm10.5 4l-3-4-4 5H5l4-5.5 3 4 4.5-6L19 12h-3.5z"/></svg>' },
    { id: 'airplay', title_key: 'btn_airplay', title: 'Truyền phát', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=airplay', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v-2H3V5h18v12h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 12l-4 6h8l-4-6z"/></svg>' },
    { id: 'audio', title_key: 'btn_audio', title: 'Âm thanh', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=audio', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>' },
    { id: 'voice', title_key: 'btn_voice', title: 'Ghi âm', action: 'shortcuts://run-shortcut?name=QuickControl&input=text&text=voice', svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>' }
];

// ==========================================
// 3. KHỞI CHẠY HỆ THỐNG
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // Xử lý ngôn ngữ & RTL
    const rawLang = safeGetItem('sttv_language') || navigator.language || navigator.userLanguage || 'en-US';
    const userLang = findBestLang(rawLang);

    const RTL_LANGS = ['ar', 'fa-IR', 'he'];
    if (RTL_LANGS.includes(userLang.split('-')[0]) || RTL_LANGS.includes(userLang)) {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }

    // Tải tệp ngôn ngữ
    const fallbackTranslations = await fetchWithCaseFallback(`Language/en-US.json`, `language/en-US.json`) || {};
    const userTranslations = await fetchWithCaseFallback(`Language/${userLang}.json`, `language/${userLang}.json`) || {};
    window.i18nData = { ...fallbackTranslations, ...userTranslations };

    function applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (window.i18nData[key]) element.innerHTML = window.i18nData[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (window.i18nData[key]) element.placeholder = window.i18nData[key];
        });
    }
    window.applyI18n = applyI18n;

    // Quản lý hiển thị nút điều khiển
    try {
        const container = document.getElementById('control-panel');
        if (!container) return;

        // Ưu tiên nạp từ Data/data.json, nếu lỗi thì dùng mảng FALLBACK_SHORTCUTS
        let rawData = await fetchWithCaseFallback('Data/data.json', 'data/data.json');
        let buttonsSource = (rawData && rawData.buttons) ? rawData.buttons : FALLBACK_SHORTCUTS;
        let renderArray = buttonsSource;

        // Xử lý Sắp xếp thứ tự (nếu có lưu trước đó)
        const savedOrder = safeGetItem('sttv_iconOrder');
        if (savedOrder) {
            try {
                const orderIds = JSON.parse(savedOrder);
                renderArray = orderIds.map(id => buttonsSource.find(b => b.id === id)).filter(b => b !== undefined);
                buttonsSource.forEach(b => { if (!renderArray.includes(b)) renderArray.push(b); });
            } catch (e) {
                renderArray = buttonsSource;
            }
        }

        // Render ra giao diện
        if (renderArray && renderArray.length > 0) {
            renderArray.forEach(item => {
                const btn = document.createElement('a');
                btn.className = 'glass-btn';
                btn.href = item.action || '#';
                btn.dataset.id = item.id;

                const localizedTitle = window.i18nData[item.title_key] || item.title || 'Phím tắt';
                // Đã chèn cứng data-i18n vào span để MutationObserver hoạt động mượt mà
                btn.innerHTML = `
                    <div class="icon-box">${item.svg || ''}</div>
                    <span class="label" data-i18n="${item.title_key}">${localizedTitle}</span>
                `;
                container.appendChild(btn);
            });
        }
        applyI18n(); // Gọi update ngôn ngữ lần đầu

        // ==========================================
        // 4. LOGIC ĐỔI CHỖ (SWAP & DRAG)
        // ==========================================
        const btnEditLayout = document.getElementById('btn-edit-layout');
        const btnConfirmSort = document.getElementById('btn-confirm-sort');
        let editMode = false;
        let selectedSwapNode = null;

        function exitEditMode() {
            editMode = false;
            document.body.classList.remove('edit-mode', 'has-selection');
            if (btnConfirmSort) btnConfirmSort.classList.add('hidden');
            
            if (selectedSwapNode) {
                selectedSwapNode.classList.remove('selected-swap');
                selectedSwapNode = null;
            }
            document.querySelectorAll('.glass-btn').forEach(b => {
                b.onclick = null;
            });
        }

        if (btnEditLayout) {
            btnEditLayout.addEventListener('click', (e) => {
                e.preventDefault();
                editMode = true;
                document.body.classList.add('edit-mode');
                
                // Đóng popup cài đặt khi vào chế độ sắp xếp
                const drawerEl = document.getElementById('settings-drawer');
                const overlay = document.getElementById('settings-overlay');
                if (drawerEl) drawerEl.classList.remove('open');
                if (overlay) overlay.classList.remove('open');

                // Hiển thị nút xác nhận sắp xếp
                if (btnConfirmSort) btnConfirmSort.classList.remove('hidden');

                // Chặn bấm chuyển trang khi đang ở chế độ edit
                document.querySelectorAll('.glass-btn').forEach(b => {
                    b.onclick = (ev) => ev.preventDefault();
                });
            });
        }

        if (btnConfirmSort) {
            btnConfirmSort.addEventListener('click', (e) => {
                e.preventDefault();
                exitEditMode();
            });
        }

        container.addEventListener('click', (e) => {
            if (!editMode) return;
            const target = e.target.closest('.glass-btn');
            if (!target) return;

            if (!selectedSwapNode) {
                selectedSwapNode = target;
                target.classList.add('selected-swap');
                document.body.classList.add('has-selection'); // Gắn cờ để nút ✔️ phát sáng
            } else if (selectedSwapNode === target) {
                target.classList.remove('selected-swap');
                selectedSwapNode = null;
                document.body.classList.remove('has-selection'); // Tắt phát sáng
            } else {
                // Thuật toán đổi chỗ 2 Node
                const temp = document.createElement('div');
                target.parentNode.insertBefore(temp, target);
                selectedSwapNode.parentNode.insertBefore(target, selectedSwapNode);
                temp.parentNode.insertBefore(selectedSwapNode, temp);
                temp.parentNode.removeChild(temp);

                selectedSwapNode.classList.remove('selected-swap');
                selectedSwapNode = null;
                document.body.classList.remove('has-selection');

                // Lưu lại mảng mới vào localStorage
                const newOrder = Array.from(container.querySelectorAll('.glass-btn')).map(b => b.dataset.id);
                safeSetItem('sttv_iconOrder', JSON.stringify(newOrder));
            }
        });

        // ==========================================
        // 5. OBSERVER LẮNG NGHE THAY ĐỔI
        // ==========================================
        const observer = new MutationObserver(() => {
            document.querySelectorAll('#control-panel [data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (window.i18nData[key]) element.innerHTML = window.i18nData[key];
            });
        });
        observer.observe(container, { childList: true, subtree: true });

    } catch (e) {
        console.error("Lỗi quá trình tải:", e);
    }
});