// **改行やダブルクオートを考慮した CSV パーサー**
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let inQuotes = false;
    let currentCell = '';

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"'; // エスケープされたダブルクオート
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentCell || currentRow.length) {
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            }
        } else {
            currentCell += char;
        }
    }

    if (currentCell || currentRow.length) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }

    return rows;
}

// **最新ツイートのリンクを Google Sheets から取得**
async function fetchLatestTweetLink() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyA1uM65I2cNrjT0SIoPoamWj4RJAYCN4uVIU7HP0I2726owYCfjJHEc_7iiitgxwAM9lPWyghXPB6/pub?gid=0&single=true&output=csv';

    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`HTTPエラー: ${response.status} - ${response.statusText}`);

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        if (rows.length <= 1) throw new Error('CSVのデータが見つかりません');

        const latestTweetLink = rows.at(-1)?.[3]?.trim();
        if (!latestTweetLink) throw new Error('ツイートリンクの取得に失敗しました');

        return latestTweetLink;
    } catch (error) {
        console.error('ツイート取得エラー:', error);
        return null;
    }
}

// **ツイートリンクからツイート ID を抽出**
function extractTweetId(tweetLink) {
    return tweetLink.match(/status\/(\d+)/)?.[1] || null;
}

// **X（旧Twitter）アプリでプロフィールページを開くための関数**
function openTwitterProfile(event) {
    event.preventDefault();
    event.stopPropagation();

    const twitterProfileUrl = "https://fxtwitter.com/shizu_zama"; // Xアプリに飛ばないURL
    window.location.href = twitterProfileUrl;
}

// **最新ツイートを埋め込む**
async function displayEmbeddedTweet() {
    const tweetContainer = document.getElementById('tweets-container');
    const latestTweetLink = await fetchLatestTweetLink();

    tweetContainer.style.cursor = "pointer";
    tweetContainer.style.position = "relative";

    // **クリック & タップイベントで X のアプリまたはWebを開く**
    tweetContainer.addEventListener("click", openTwitterProfile);
    tweetContainer.addEventListener("touchstart", openTwitterProfile); // スマホのタップ対応

    if (!latestTweetLink) {
        tweetContainer.textContent = 'ツイートを取得できませんでした。';
        return;
    }

    const tweetId = extractTweetId(latestTweetLink);
    if (!tweetId) {
        tweetContainer.textContent = 'ツイートIDの取得に失敗しました。';
        return;
    }

    // **ツイートを表示するコンテナ**
    const tweetDiv = document.createElement('div');
    tweetDiv.style.position = "relative";
    tweetContainer.appendChild(tweetDiv);

    // **ツイートを埋め込む**
    twttr.widgets.createTweet(tweetId, tweetDiv).then(() => {
        // **ツイート内部の `iframe` を無効化**
        tweetDiv.querySelectorAll('iframe').forEach(iframe => {
            iframe.style.pointerEvents = 'none'; // クリック無効化
        });

        // **ツイートの上に透明なレイヤーを作成**
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(255, 255, 255, 0)"; // 完全透明
        overlay.style.zIndex = "10";
        overlay.style.cursor = "pointer";

        // **透明レイヤーをクリック & タップで X に遷移**
        overlay.addEventListener("click", openTwitterProfile);
        overlay.addEventListener("touchstart", openTwitterProfile); // スマホ対応

        tweetDiv.appendChild(overlay);
    }).catch(() => {
        tweetContainer.textContent = 'ツイートの埋め込みに失敗しました。';
    });
}

// **ナビゲーションの初期化**
function initializeNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const closeButton = document.querySelector('.close-button');
    const navMenu = document.querySelector('.nav-menu');
    const headerHeight = document.querySelector('.header').offsetHeight;

    function toggleMenu() {
        const isActive = navMenu.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', !isActive);
        navMenu.classList.toggle('active');
    }

    menuToggle?.addEventListener('click', toggleMenu);
    closeButton?.addEventListener('click', toggleMenu);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight,
                    behavior: 'smooth'
                });
            }
            toggleMenu();
        });
    });

    document.addEventListener('click', (event) => {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            if (navMenu.classList.contains('active')) {
                toggleMenu();
            }
        }
    });
}

// **ヒーロースライダーの初期化**
function initializeSlider() {
    const slides = document.querySelectorAll(".hero-slider picture");
    let currentSlide = 0;

    function showNextSlide() {
        slides[currentSlide].style.opacity = 0;
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].style.opacity = 1;
    }

    setInterval(showNextSlide, 3000);
}

// **ページの初期化**
function initializePage() {
    initializeNavigation();
    displayEmbeddedTweet();
    initializeSlider();
}

document.addEventListener("DOMContentLoaded", initializePage);
