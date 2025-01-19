// 改行やダブルクオートを考慮したCSVパーサー
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let inQuotes = false;
    let currentCell = '';

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            inQuotes = !inQuotes; // ダブルクオートの開始・終了を切り替え
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }

        if (i === csvText.length - 1) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
        }
    }

    return rows;
}

// ナビゲーション初期化
function initializeNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;
    const headerHeight = document.querySelector('.header').offsetHeight;

    // メニューのトグル処理
    menuToggle?.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu?.setAttribute('aria-hidden', isExpanded);

        menuToggle.classList.toggle('active');
        navMenu?.classList.toggle('active');
        body.classList.toggle('menu-open');
    });

    // スムーズスクロール処理
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Google Sheetsから最新ツイートリンクを取得
async function fetchLatestTweetLink() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUjoRWjFzoD3Dcs9OaJeF7Uv6TzL5D5EVe4tgcQtEQLpXYts1Bcl5qy9eHenztzb-IVQJdF0cYD7cl/pub?output=csv'; // Google Sheetsの公開CSVリンク

    try {
        console.log('Fetching CSV from:', csvUrl);

        // CSVデータを取得
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        // CSVをパース
        const csvText = await response.text();
        console.log('Raw CSV data:', csvText);

        const rows = parseCSV(csvText); // 改良版パーサーを使用
        console.log('Parsed rows:', rows);

        if (rows.length <= 1) {
            throw new Error('No data found in CSV');
        }

        // 最後の行の4列目（ツイートリンク列）を取得
        const latestRow = rows[rows.length - 1];
        const latestTweetLink = latestRow[3]?.trim();

        if (!latestTweetLink) {
            throw new Error('Invalid data in the 4th column or column is empty');
        }

        console.log('Latest tweet link:', latestTweetLink);
        return latestTweetLink;
    } catch (error) {
        console.error('Error fetching or processing CSV:', error);
        return null;
    }
}

// ツイートリンクからツイートIDを抽出
function extractTweetId(tweetLink) {
    const match = tweetLink.match(/status\/(\d+)/);
    return match ? match[1] : null;
}

// ツイート埋め込みを表示
async function displayEmbeddedTweet() {
    const tweetContainer = document.getElementById('tweets-container');

    // 最新ツイートリンクを取得
    const latestTweetLink = await fetchLatestTweetLink();
    if (!latestTweetLink) {
        tweetContainer.textContent = 'ツイートの取得に失敗しました。';
        return;
    }

    // ツイートIDを抽出
    const tweetId = extractTweetId(latestTweetLink);
    if (!tweetId) {
        tweetContainer.textContent = 'ツイートIDを取得できませんでした。';
        return;
    }

    // 埋め込みツイートを表示
    const tweetDiv = document.createElement('div');
    tweetContainer.appendChild(tweetDiv);

    twttr.widgets.createTweet(tweetId, tweetDiv, {
        theme: 'light', // ダークテーマにしたい場合は 'dark'
    }).catch(error => {
        console.error(`Failed to embed tweet ${tweetId}:`, error);
        tweetContainer.textContent = 'ツイートの埋め込みに失敗しました。';
    });
}

// 初期化処理
function initializePage() {
    initializeNavigation(); // ナビゲーション初期化
    displayEmbeddedTweet(); // 最新ツイートの表示
}

// DOMの準備完了後に初期化を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}