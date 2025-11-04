const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage = 1;
const itemsPerPage = 10;
let allLoadedData = [];
let loading = false;
let moreDataAvailable = true;
let nextBatchSize = itemsPerPage; 
let doubleNext = true; 
let offset = 0;

const tableBodyElement = document.getElementById("tableBody");
const cardViewElement = document.getElementById("cardView");
const loaderElement = document.getElementById("loader");
const loadMoreElement = document.getElementById("loadingMore");
const scrollContainer = document.getElementById("cardsContainer");
const tableSection = document.getElementById("tableView");
const cardSection = document.getElementById("cardView");
const fakeScrollBar = document.querySelector(".fake-scroll-wrapper");

// Kiểm tra mobile view
function checkMobileView() {
    return window.innerWidth <= 768;
}

// Chuyển chế độ hiển thị
function switchViewMode() {
    if (checkMobileView()) {
        tableSection.style.display = 'none';
        cardSection.style.display = 'flex';
        if (fakeScrollBar) fakeScrollBar.style.display = 'none';
    } else {
        tableSection.style.display = 'block';
        cardSection.style.display = 'none';
        if (fakeScrollBar) fakeScrollBar.style.display = 'block';
    }
}

// Thêm record mới **không ảnh hưởng offset**
function addNewRecordLocally(record) {
    allLoadedData.unshift(record); // Thêm đầu
    appendNewItems([record]);       // Chỉ render record mới
}

// Load dữ liệu từ API
async function loadMoreData() {
    if (!moreDataAvailable || loading) return;
    loading = true;

    if (offset === 0) loaderElement.style.display = "block";
    else loadMoreElement.style.display = "block";

    const limit = nextBatchSize;
    const page = Math.floor(offset / itemsPerPage) + 1;

    try {
        const response = await fetch(`${API_URL}?page=${page}&limit=${limit}&sortBy=id&order=asc`);
        const dataList = await response.json();

        if (dataList.length === 0) {
            moreDataAvailable = false;
        } else {
            allLoadedData = [...allLoadedData, ...dataList];
            appendNewItems(dataList);

            offset += dataList.length;

            // Xen kẽ batch size: 10 → 20 → 10 → 20 …
            nextBatchSize = doubleNext ? itemsPerPage * 2 : itemsPerPage;
            doubleNext = !doubleNext;
        }
    } catch (error) {
        console.error(error);
        moreDataAvailable = false;
    } finally {
        loaderElement.style.display = "none";
        loadMoreElement.style.display = "none";
        loading = false;
    }
}

// Append item vào table + card view
function appendNewItems(dataList) {
    dataList.forEach(user => {
        // Table
        const tableRow = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        tableRow.style.backgroundColor = user.color || "#FFFFFF";

        const isMale = user.genre?.toLowerCase() === 'male';
        const genderBadge = isMale ? 'badge-male' : 'badge-female';
        const genderLabel = isMale ? 'Nam' : 'Nữ';
        const genderIcon = isMale ? 'fa-mars' : 'fa-venus';

        tableRow.innerHTML = `
            <td>${user.id || 'N/A'}</td>
            <td><img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small"></td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.company || 'N/A'}</td>
            <td><span class="card-badge ${genderBadge}"><i class="fa-solid ${genderIcon}"></i> ${genderLabel}</span></td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.phone || 'N/A'}</td>
            <td>${user.dob || 'N/A'}</td>
        `;
        tableBodyElement.appendChild(tableRow);

        // Card
        const card = document.createElement("div");
        card.className = "card";
        card.style.backgroundColor = user.color || "#FFF";

        card.innerHTML = `
            <div class="card-header">
                <img src="${user.avatar || 'https://via.placeholder.com/60'}" class="avatar">
                <div class="card-info">
                    <div class="card-name">${user.name || 'N/A'}</div>
                    <div class="card-company">${user.company || 'N/A'}</div>
                </div>
                <span class="card-badge">${genderLabel}</span>
            </div>
        `;
        cardViewElement.appendChild(card);
    });
}

// Scroll event
scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollTop + clientHeight >= scrollHeight - 1 && moreDataAvailable) {
        loadMoreElement.style.display = "block";
        loadMoreData();
    }
});

// Resize event
window.addEventListener('resize', switchViewMode);

// Fake scrollbar sync
if (fakeScrollBar) {
    fakeScrollBar.addEventListener('scroll', () => scrollContainer.scrollLeft = fakeScrollBar.scrollLeft);
    scrollContainer.addEventListener('scroll', () => {
        if (!checkMobileView()) fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
    });
}

// Khởi tạo
switchViewMode();
loadMoreData();
