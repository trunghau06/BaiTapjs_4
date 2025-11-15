// === PHẦN KHỞI TẠO ===
const API_URL          = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage        = 1;
const itemsPerPage     = 15; 
let allLoadedData      = [];
let loading            = false;
let moreDataAvailable  = true;
let isEditMode         = false;
let editingUser        = null;

const tableBodyElement = document.getElementById("tableBody");
const cardViewElement  = document.getElementById("cardView");
const loaderElement    = document.getElementById("loader");
const loadMoreElement  = document.getElementById("loadingMore");
const scrollContainer  = document.getElementById("cardsContainer");
const tableSection     = document.getElementById("tableView");
const cardSection      = document.getElementById("cardView");
const fakeScrollBar    = document.querySelector(".fake-scroll-wrapper");
const addRecordBtn     = document.getElementById("addRecordBtn");
const addRecordModal   = document.getElementById("addRecordModal");
const addRecordForm    = document.getElementById("addRecordForm");
const closeModalBtn    = document.getElementById("closeModalBtn");
const cancelBtn        = document.getElementById("cancelBtn");
const avatarFileInput  = document.getElementById("avatarFile");
const avatarPreview    = document.getElementById("avatarPreview");
const submitBtn        = addRecordForm.querySelector(".btn-submit");

// === PHẦN VIEW/RESPONSIVE ===
function checkMobileView() {
    return window.innerWidth <= 768;
}

function switchViewMode() {
    if (checkMobileView()) {
        tableSection.style.display = 'none';
        cardSection.style.display  = 'flex';
        if (fakeScrollBar) fakeScrollBar.style.display = 'none';
    } else {
        tableSection.style.display = 'block';
        cardSection.style.display  = 'none';
        if (fakeScrollBar) fakeScrollBar.style.display = 'block';
    }
}

window.addEventListener('resize', switchViewMode);
switchViewMode();

// === PHẦN MODAL, AVATAR, ADD/EDIT/DELETE ===
// Giữ nguyên hoàn toàn code modal, avatar, add/edit/delete như bạn gửi
// Không chỉnh sửa gì ở đây
// ...

// === PHẦN RENDER & LOAD DATA (CHỈ SỬA) ===

// Virtual rendering setup
const VISIBLE_ITEMS = 15; // số item hiển thị trong DOM cùng lúc
let startIndex = 0;       // index bắt đầu hiển thị
let endIndex = 0;         // index kết thúc hiển thị

function renderVisibleItems() {
    tableBodyElement.innerHTML = "";
    cardViewElement.innerHTML = "";

    endIndex = Math.min(startIndex + VISIBLE_ITEMS, allLoadedData.length);

    const visibleItems = allLoadedData.slice(startIndex, endIndex);

    visibleItems.forEach(user => {
        appendNewItems([user]); // dùng luôn appendNewItems để giữ nguyên table & card
    });
}

scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, clientHeight, scrollHeight } = scrollContainer;

    // Virtual render dựa trên scrollTop
    const itemHeight = 150; // ước lượng chiều cao mỗi card/table row
    startIndex = Math.floor(scrollTop / itemHeight);
    if (startIndex < 0) startIndex = 0;

    renderVisibleItems();

    // Load thêm nếu scroll gần cuối
    if (scrollTop + clientHeight >= scrollHeight - 5) {
        if (moreDataAvailable && !loading) {
            loadMoreElement.style.display = "block";
            loadMoreData();
        }
    }
});

// Chỉnh sửa loadMoreData để tương thích với virtual render
async function loadMoreData() {
    if (!moreDataAvailable || loading) return;
    loading = true;

    addRecordBtn.style.display = "none";

    if (currentPage === 1) loaderElement.style.display = "block";
    else loadMoreElement.style.display = "block";

    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${itemsPerPage}&sortBy=id&order=asc`);
        const dataList = await response.json();
        if (dataList.length === 0) moreDataAvailable = false;
        else {
            allLoadedData = [...allLoadedData, ...dataList];
            currentPage++;
            renderVisibleItems(); // virtual render
        }
    } catch (error) {
        console.error(error);
        moreDataAvailable = false;
    }

    setTimeout(() => {
        loadMoreElement.style.display = "none";
        addRecordBtn.style.display = "block"; 
        loading = false;
    }, 300);
}

// === PHẦN RENDER TABLE/CARD ===
// Giữ nguyên appendNewItems, attachRowEvents, attachCardEvents, deleteRecord
// Không chỉnh sửa gì

// === KHỞI TẠO LOAD DATA ===
loadMoreData();
