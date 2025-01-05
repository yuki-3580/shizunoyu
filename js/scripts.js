// ページ読み込み時の処理
document.addEventListener("DOMContentLoaded", () => {
    console.log("Shizunoyu Sauna website is loaded!");

    // 例: ヘッダーナビゲーションをクリックした際のスムーズスクロール
    const navLinks = document.querySelectorAll("nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href").slice(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});