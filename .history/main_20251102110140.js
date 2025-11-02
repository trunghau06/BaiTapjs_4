const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage = 1;
const itemsPerPage = 8; // 🎯 Đã đổi thành tải 8 item mỗi lần
const maxVisibleItems = 40; // 🎯 Tăng giới hạn DOM để ít bị xóa item hơn (giảm nhảy)
let loading = false;
let moreDataAvailable = true;

// Lấy các element DOM
const tableBodyElement = document.getElementById("tableBody");
const cardViewElement = document.getElementById("cardView");
const loaderElement = document.getElementById("loader");
const loadMoreElement = document.getElementById("loadingMore");
const scrollContainer = document.getElementById("cardsContainer");
const tableSection = document.getElementById("tableView");
const cardSection = document.getElementById("cardView");
const fakeScrollBar = document.querySelector(".fake-scroll-wrapper");

// -------------------- View Utilities --------------------

function checkMobileView() {
    return window.innerWidth <= 768;
}

function switchViewMode() {
    if (checkMobileView()) {
        tableSection.style.display = 'none';
        cardSection.style.display = 'flex';
        // Ẩn thanh cuộn giả nếu có
        if (fakeScrollBar) fakeScrollBar.style.display = 'none';
    } else {
        tableSection.style.display = 'block';
        cardSection.style.display = 'none';
        // Hiện thanh cuộn giả nếu có
        if (fakeScrollBar) fakeScrollBar.style.display = 'block';
    }
}

// -------------------- Fetch Data --------------------
async function loadMoreData() {
    if (!moreDataAvailable || loading) return;

    loading = true;
    
    // Hiển thị loader ở đúng vị trí
    if (currentPage === 1) {
        loaderElement.style.display = "block";
    } else {
        loadMoreElement.style.display = "block";
    }

    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${itemsPerPage}`);
        const dataList = await response.json();

        if (dataList.length === 0) {
            moreDataAvailable = false;
        } else {
            displayNewItems(dataList);
            currentPage++;
            
            // Hiện container sau khi load data đầu tiên
            if (currentPage === 2) {
                scrollContainer.style.display = "block";
                loaderElement.style.display = "none";
            }
        }
    } catch (error) {
        console.error(error);
    }

    loadMoreElement.style.display = "none";
    loading = false;
}

// -------------------- Hiển thị & Trim DOM --------------------
function displayNewItems(userList) {
    // Sử dụng DocumentFragment để tối ưu việc thêm DOM
    const fragmentTable = document.createDocumentFragment();
    const fragmentCard = document.createDocumentFragment();
    
    userList.forEach(user => {
        // Tạo Table Row và Card
        const tableRow = createTableRow(user);
        const cardElement = createCardElement(user);
        
        fragmentTable.appendChild(tableRow);
        fragmentCard.appendChild(cardElement);
    });

    tableBodyElement.appendChild(fragmentTable);
    cardViewElement.appendChild(fragmentCard);

    // -------- Giới hạn số lượng items trên DOM --------
    // Giữ 40 item. Khi cuộn và tải thêm, nếu tổng vượt 40, item cũ nhất sẽ bị xóa.
    limitDOMItems(tableBodyElement);
    limitDOMItems(cardViewElement);
}

// -------------------- Giới hạn items trên DOM --------
function limitDOMItems(parentElement) {
    while (parentElement.children.length > maxVisibleItems) {
        // Xóa item cũ nhất (phần tử đầu tiên)
        parentElement.removeChild(parentElement.children[0]); 
    }
}

// -------------------- Item Creators (Đã rút gọn) --------------------

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
        <td>${user.street || 'N/A'}</td>
        <td>${user.building || 'N/A'}</td>
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
            <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar" loading="lazy">
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


// -------------------- Scroll Event --------------------
scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    
    // Kích hoạt tải khi còn 100px (hoặc khoảng 90%) là đến cuối
    if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && moreDataAvailable) {
        loadMoreData();
    }
});

// -------------------- Xử lý resize --------
window.addEventListener('resize', () => {
    switchViewMode();
});

// -------------------- Đồng bộ horizontal scroll --------
if (fakeScrollBar) {
    const fakeScrollContent = document.getElementById('fakeScroll');
    const dataTable = document.querySelector('.data-table');
    
    // Thiết lập độ rộng scroll giả ban đầu
    if (dataTable && fakeScrollContent) {
        // Hàm này sẽ tính toán và set minWidth cho thanh cuộn giả
        const setFakeScrollWidth = () => {
            const computedStyle = window.getComputedStyle(dataTable);
            const tableWidth = computedStyle.minWidth;
            if (tableWidth && tableWidth !== '0px') {
                 fakeScrollContent.style.minWidth = tableWidth;
            } else {
                 // Trường hợp minWidth chưa được tính, dùng scrollWidth (ít chính xác hơn)
                 fakeScrollContent.style.minWidth = `${dataTable.scrollWidth}px`;
            }
        };

        // Set lần đầu
        setFakeScrollWidth();

        // Đồng bộ cuộn ngang
        fakeScrollBar.addEventListener('scroll', () => {
            scrollContainer.scrollLeft = fakeScrollBar.scrollLeft;
        });
        
        scrollContainer.addEventListener('scroll', () => {
            if (!checkMobileView() && fakeScrollBar) {
                fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
            }
        });

        // Cập nhật lại width khi resize
        window.addEventListener('resize', setFakeScrollWidth);
    }
}

// -------------------- Khởi tạo --------
switchViewMode();
loadMoreData();