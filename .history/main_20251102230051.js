const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage = 1;
const itemsPerPage = 12;
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

// Kiểm tra mobile view
function checkMobileView() {
    return window.innerWidth <= 768;
}

// Cập nhật chế độ hiển thị
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

// -------------------- Lấy dữ liệu từ API --------------------
async function loadMoreData() {
    if (!moreDataAvailable || loading) return;

    loading = true;
    
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
            allLoadedData = [...allLoadedData, ...dataList];
            allLoadedData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            displayAllItems();
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
    
    // Cập nhật thông báo cho cả table và card
    if (currentPage > 2) {
        const totalItems = allLoadedData.length;
        
        // Card view
        loadMoreElement.textContent = `✅ Đã tải ${totalItems} items`;
        loadMoreElement.style.display = "block";
        
        // Table view - thêm row loading
        const loadingRow = document.createElement("tr");
        loadingRow.id = "table-loading-row";
        loadingRow.innerHTML = `
            <td colspan="19" style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); color: #fff; font-weight: bold;">
                ✅ Đã tải ${totalItems} items
            </td>
        `;
        tableBodyElement.appendChild(loadingRow);
        
        setTimeout(() => {
            loadMoreElement.style.display = "none";
            const row = document.getElementById('table-loading-row');
            if (row) row.remove();
        }, 2000);
    }
    
    if (!moreDataAvailable) {
        const totalItems = allLoadedData.length;
        
        // Card view
        loadMoreElement.textContent = `✅ Đã tải hết tất cả ${totalItems} items!`;
        loadMoreElement.style.display = "block";
        
        // Table view
        const loadingRow = document.createElement("tr");
        loadingRow.id = "table-loading-row";
        loadingRow.innerHTML = `
            <td colspan="19" style="text-align: center; padding: 15px; background: rgba(40, 167, 69, 0.2); color: #28a745; font-weight: bold;">
                ✅ Đã tải hết tất cả ${totalItems} items!
            </td>
        `;
        tableBodyElement.appendChild(loadingRow);
    }
}loadMoreElement.style.display = "block";
    }
}

// -------------------- Hiển thị tất cả items --------------------
function displayAllItems() {
    tableBodyElement.innerHTML = '';
    cardViewElement.innerHTML = '';
    
    allLoadedData.forEach(user => {
        // -------- Table row --------
        const tableRow = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        tableRow.style.backgroundColor = user.color || "#fff";
        
        const isGenderMale = user.genre?.toLowerCase() === 'male';
        const genderBadgeClass = isGenderMale ? 'badge-male' : 'badge-female';
        const genderLabel = isGenderMale ? 'Nam' : 'Nữ';
        const genderIconClass = isGenderMale ? 'fa-mars' : 'fa-venus';
        
        tableRow.innerHTML = `
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
        tableBodyElement.appendChild(tableRow);

        // -------- Card --------
        const cardElement = document.createElement("div");
        cardElement.setAttribute("data-id", user.id);
        cardElement.className = "card";
        cardElement.style.backgroundColor = user.color || "#fff";
        
        const displayGender = isGenderMale ? 'Nam' : 'Nữ';
        
        cardElement.innerHTML = `
            <div class="card-header">
                <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${user.name || 'N/A'}</div>
                    <div class="card-company">${user.company || 'N/A'}</div>
                </div>
                <span class="card-badge ${genderBadgeClass}">
                    ${displayGender}
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
        cardViewElement.appendChild(cardElement);
    });
}

// -------------------- Xử lý scroll --------
scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    
    if (scrollTop + clientHeight >= scrollHeight - 200 && !loading && moreDataAvailable) {
        loadMoreData();
    }
});

// -------------------- Xử lý resize --------
window.addEventListener('resize', () => {
    switchViewMode();
});

// -------------------- Đồng bộ horizontal scroll --------
function setupFakeScroll() {
    if (!fakeScrollBar) return;
    
    const fakeScrollContent = document.getElementById('fakeScroll');
    const dataTable = document.querySelector('.data-table');
    
    if (dataTable && fakeScrollContent) {
        // Đợi table render xong rồi mới set width
        setTimeout(() => {
            const tableWidth = dataTable.scrollWidth + 'px';
            fakeScrollContent.style.minWidth = tableWidth;
            fakeScrollContent.style.width = tableWidth;
        }, 100);
        
        // Scroll fake -> scroll container
        fakeScrollBar.addEventListener('scroll', () => {
            scrollContainer.scrollLeft = fakeScrollBar.scrollLeft;
        });
        
        // Scroll container -> scroll fake
        scrollContainer.addEventListener('scroll', () => {
            if (!checkMobileView()) {
                fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
            }
        });
    }
}

// Gọi lại sau mỗi lần render
function updateFakeScrollWidth() {
    if (!checkMobileView() && fakeScrollBar) {
        const fakeScrollContent = document.getElementById('fakeScroll');
        const dataTable = document.querySelector('.data-table');
        if (dataTable && fakeScrollContent) {
            const tableWidth = dataTable.scrollWidth + 'px';
            fakeScrollContent.style.minWidth = tableWidth;
            fakeScrollContent.style.width = tableWidth;
        }
    }
}

// -------------------- Khởi tạo --------
switchViewMode();
setupFakeScroll();
loadMoreData();