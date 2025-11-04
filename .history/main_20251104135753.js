const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage = 1;
const itemsPerPage = 12; 
let allLoadedData = [];
let loading = false;
let moreDataAvailable = true;
let loadCount = 0; 
const displayBatches = [12, 24];

const tableBodyElement = document.getElementById("tableBody");
const cardViewElement = document.getElementById("cardView");
const loaderElement = document.getElementById("loader");
const loadMoreElement = document.getElementById("loadingMore");
const scrollContainer = document.getElementById("cardsContainer");
const tableSection = document.getElementById("tableView");
const cardSection = document.getElementById("cardView");
const fakeScrollBar = document.querySelector(".fake-scroll-wrapper");

// kiem tra xem co phai mobile view khong
function checkMobileView() {
    return window.innerWidth <= 768;
}

// cap nhat che do hien thi theo mobile hay desktop
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

// load them du lieu tu API
aasync function loadMoreData() {
    if (!moreDataAvailable || loading) return;
    loading = true;

    const displayCount = displayBatches[loadCount % displayBatches.length];

    if (currentPage === 1) {
        loaderElement.style.display = "block";
    } else {
        loadMoreElement.style.display = "block";
    }

    try {
        // Lấy số item theo batch hiện tại
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${displayCount}&sortBy=id&order=asc`);
        const dataList = await response.json();

        if (!Array.isArray(dataList) || dataList.length === 0) {
            moreDataAvailable = false;
        } else {
            // Nếu batch cuối không đủ số lượng, vẫn hiển thị tất cả
            appendNewItems(dataList);

            allLoadedData = [...allLoadedData, ...dataList];
            currentPage++;
            loadCount++;

            if (currentPage === 2) {
                scrollContainer.style.display = "block";
                loaderElement.style.display = "none";
            }
        }
    } catch (error) {
        console.error(error);
    }

    // Ẩn load more khi hết dữ liệu hoặc đủ 100 item
    if (!moreDataAvailable || allLoadedData.length >= 100) {
        loadMoreElement.style.display = "none";
        loading = false;
    } else {
        setTimeout(() => {
            loadMoreElement.style.display = "none"; 
            loading = false;
        }, 500);
    }
}


// them cac phan tu moi vao table va card view
function appendNewItems(dataList) {
    dataList.forEach(user => {
        // Table
        const tableRow = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        tableRow.style.backgroundColor = user.color || "#FFFFFF";

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

        // Card
        const cardElement = document.createElement("div");
        cardElement.setAttribute("data-id", user.id);
        cardElement.className = "card";
        cardElement.style.backgroundColor = user.color || "#FFFFFF";

        const displayGender = isGenderMale ? 'Nam' : 'Nứ';

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

scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

    if (scrollTop + clientHeight >= scrollHeight - 1) {
        if (moreDataAvailable) {
            loadMoreElement.style.display = "block";
            loadMoreElement.querySelector('div:last-child').textContent = `...`;
            loadMoreData();
        } else {
            loadMoreElement.style.display = "none";
        }
    }
});

window.addEventListener('resize', () => {
    switchViewMode();
});

if (fakeScrollBar) {
    fakeScrollBar.addEventListener('scroll', () => {
        scrollContainer.scrollLeft = fakeScrollBar.scrollLeft;
    });
    
    scrollContainer.addEventListener('scroll', () => {
        if (!checkMobileView()) {
            fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
        }
    });
}


// khoi tao view va load batch dau tien
switchViewMode();
loadMoreData();
