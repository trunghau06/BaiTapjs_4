const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage = 1;
const itemsPerPage = 12;
const MAX_ITEMS_TOTAL = 100; // Giới hạn tổng cộng 100 items
const MAX_DOM_ELEMENTS = 40; 
let allLoadedData = []; 
let loading = false;
let moreDataAvailable = true;

const tableBodyElement = document.getElementById("tableBody");
const cardViewElement = document.getElementById("cardView");
const loaderElement = document.getElementById("loader");
const loadMoreElement = document.getElementById("loadingMore");
const scrollContainer = document.getElementById("cardsContainer");
const tableSection = document.getElementById("tableView");
const cardSection = document.getElementById("cardView");
const fakeScrollBar = document.querySelector(".fake-scroll-wrapper");

// -------------------- Logic Kích Thước Batch Động --------------------

function getNextBatchSize() {
    // Logic tuần hoàn: Trang Lẻ (1, 3, 5...) là 12, Trang Chẵn (2, 4, 6...) là 24
    if (currentPage % 2 !== 0) {
        return 12; // Lần 1, 3, 5, ...
    } else {
        return 24; // Lần 2, 4, 6, ...
    }
}

// -------------------- View Utilities --------------------

function checkMobileView() {
    return window.innerWidth <= 768;
}

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

// -------------------- Fetch Data, Sorting & Re-Render --------------------
async function loadMoreData() {
    if (!moreDataAvailable || loading) return;

    loading = true;
    
    // 1. Tính toán batch size động
    let itemsToFetch = getNextBatchSize();
    let currentPageSize = itemsToFetch; 
    
    // Điều chỉnh lần tải cuối cùng
    if (allLoadedData.length + itemsToFetch > MAX_ITEMS_TOTAL) {
        currentPageSize = MAX_ITEMS_TOTAL - allLoadedData.length;
    }
    
    // Hiển thị loader
    if (currentPage === 1) {
        loaderElement.style.display = "block";
    } else {
        loadMoreElement.style.display = "block";
        loadMoreElement.querySelector('div:last-child').textContent = `Đang tải ${currentPageSize} item...`;
    }

    try {
        // 2. GỌI API: Dùng LIMIT ĐỘNG VÀ SORT API
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${currentPageSize}&sortBy=id&order=asc`);
        const dataList = await response.json();

        if (dataList.length === 0 || allLoadedData.length >= MAX_ITEMS_TOTAL) {
            moreDataAvailable = false;
        } else {
            // 3. Nối dữ liệu mới vào mảng tổng
            allLoadedData = allLoadedData.concat(dataList);

            // 4. SẮP XẾP LẠI TRÊN CLIENT THEO SỐ NGUYÊN (BẮT BUỘC để sửa lỗi API)
            allLoadedData.sort((a, b) => Number(a.id) - Number(b.id));

            // 5. TÁI RENDER TOÀN BỘ danh sách đã sắp xếp
            displaySortedItems(allLoadedData);

            currentPage++;
        }
    } catch (error) {
        console.error(error);
    }
    
    // 6. Ẩn loader
    loadMoreElement.style.display = "none";
    loading = false;
}

// -------------------- Tái Render Toàn Bộ Dữ liệu Sắp Xếp --------------------

function displaySortedItems(userList) {
    // 1. Xóa toàn bộ DOM hiện tại
    tableBodyElement.innerHTML = '';
    cardViewElement.innerHTML = '';

    const fragmentTable = document.createDocumentFragment();
    const fragmentCard = document.createDocumentFragment();

    userList.forEach(user => {
        // 2. Tạo và thêm vào Fragment
        fragmentTable.appendChild(createTableRow(user));
        fragmentCard.appendChild(createCardElement(user));
    });
    
    // 3. Thêm Fragment vào DOM
    tableBodyElement.appendChild(fragmentTable);
    cardViewElement.appendChild(fragmentCard);
    
    // 4. Giới hạn DOM tối đa (Simulated Trimming)
    limitDOMItems(tableBodyElement);
    limitDOMItems(cardViewElement);
}

// -------------------- Giới hạn items trên DOM (Simulated Trimming) --------
function limitDOMItems(parentElement) {
    // Giữ DOM tối đa (MAX_DOM_ELEMENTS)
    while (parentElement.children.length > MAX_DOM_ELEMENTS) {
        parentElement.removeChild(parentElement.children[0]); // xóa item cũ nhất
    }
}

// -------------------- Item Creators --------------------

function createTableRow(user) {
    const tr = document.createElement("tr");
    tr.className = "data-row";
    tr.setAttribute("data-id", user.id);
    tr.style.backgroundColor = user.color || "#fff";
    
    const isGenderMale = user.genre?.toLowerCase() === 'male';
    const genderBadgeClass = isGenderMale ? 'badge-male' : 'badge-female';
    const genderLabel = isGenderMale ? 'Nam' : 'Nữ';
    const genderIconClass = isGenderMale ? 'fa-mars' : 'fa-venus';
    
    tr.innerHTML = `
        <td>${user.id || 'N/A'}</td>
        <td><img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small" loading="lazy"></td>
        <td>${user.name || 'N/A'}</td>
        <td>${user.company || 'N/A'}</td>
        <td>
            <span class="card-badge ${genderBadgeClass}">
                <i class="fa-solid ${genderIconClass}"></i> ${genderLabel}
            </span>
        </td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.phone || 'N/A'}</td>
        <td>${user.dob || 'N/A'}</td>
        <td>${user.color || 'N/A'}</td>
        <td>${user.timezone || 'N/A'}</td>
        <td>${user.music || 'N/A'}</td>
        <td>${user.city || 'N/A'}</td>
        <td>${user.state || 'N/A'}</td>
        <td>${user.address || 'N/A'}</td>
        <td>${user.building || 'N/A'}</td>
        <td>${user.street || 'N/A'}</td>
        <td>${user.zip || user.zipcode || 'N/A'}</td>
        <td>${user.createdAt || 'N/A'}</td>
        <td>${user.password || 'N/A'}</td>
    `;
    return tr;
}

function createCardElement(user) {
    const card = document.createElement("div");
    card.setAttribute("data-id", user.id);
    card.className = "card";
    card.style.backgroundColor = user.color || "#fff";
    
    const isGenderMale = user.genre?.toLowerCase() === 'male';
    const genderLabel = isGenderMale ? 'Nam' : 'Nữ';
    
    card.innerHTML = `
        <div class="card-header">
            <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar">
            <div class="card-info">
                <div class="card-name">${user.name || 'N/A'}</div>
                <div class="card-company">${user.company || 'N/A'}</div>
            </div>
            <span class="card-badge ${isGenderMale ? 'badge-male' : 'badge-female'}">
                ${genderLabel}
            </span>
        </div>
        <div class="card-body">
            <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${user.id || 'N/A'}</div>
            <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${user.name || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${user.genre || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${user.company || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${user.dob || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> ${user.color || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${user.timezone || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${user.music || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${user.address || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${user.city || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-map card-icon"></i> <strong>State:</strong> ${user.state || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-road card-icon"></i> <strong>Street:</strong> ${user.street || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-building-columns card-icon"></i> <strong>Building:</strong> ${user.building || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-hashtag card-icon"></i> <strong>ZIP:</strong> ${user.zip || user.zipcode || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${user.email || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${user.phone || 'N/A'}</div>
            <div class="card-item"><i class="fa-solid fa-lock card-icon"></i> <strong>Password:</strong> ${user.password || 'N/A'}</div>
        </div>
    `;
    return card;
}


// -------------------- Scroll Event Handler (Giữ nguyên) --------------------
scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    
    // Kích hoạt tải khi còn 100px nữa là đến cuối
    if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && moreDataAvailable) {
        loadMoreData();
    }
});

// -------------------- Xử lý resize (Giữ nguyên) --------------------
window.addEventListener('resize', () => {
    switchViewMode();
});

// -------------------- Đồng bộ horizontal scroll (Giữ nguyên) --------
if (fakeScrollBar) {
    const fakeScrollContent = document.getElementById('fakeScroll');
    const dataTable = document.querySelector('.data-table');
    
    if (dataTable && fakeScrollContent) {
        const setFakeScrollWidth = () => {
            const computedStyle = window.getComputedStyle(dataTable);
            const tableWidth = computedStyle.minWidth;
            if (tableWidth && tableWidth !== '0px') {
                 fakeScrollContent.style.minWidth = tableWidth;
            } else {
                 fakeScrollContent.style.minWidth = `${dataTable.scrollWidth}px`;
            }
        };

        setFakeScrollWidth();

        fakeScrollBar.addEventListener('scroll', () => {
            scrollContainer.scrollLeft = fakeScrollBar.scrollLeft;
        });
        
        scrollContainer.addEventListener('scroll', () => {
            if (!checkMobileView() && fakeScrollBar) {
                fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
            }
        });

        window.addEventListener('resize', setFakeScrollWidth);
    }
}

// -------------------- Init --------
switchViewMode();
loadMoreData();