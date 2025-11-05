const API_URL = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage = 1;
const itemsPerPage = 10;
let allLoadedData = [];
let loading = false;
let moreDataAvailable = true;
let nextBatchSize = itemsPerPage; 
let doubleNext = true; 
let offset = 0; 

const newRecord = {
  avatar: "https://via.placeholder.com/60",
  name: "Nguyen Van A",
  company: "ABC Company",
  genre: "male",
  email: "a@example.com",
  phone: "0123456789",
  dob: "2000-01-01",
  color: "#ff0000",
  timezone: "GMT+7",
  music: "Pop",
  city: "Ho Chi Minh City",
  state: "Vietnam",
  address: "123 Street",
  street: "Le Loi",
  building: "Building A",
  zip: "700000",
  createdAt: new Date().toISOString(),
  password: "123456"
};

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

async function deleteLastAndAddRecord(newRecord) {
    try {
        // Xóa record cuối cùng nếu đủ 100
        // Xóa record cuối cùng nếu đủ 100
        if (allLoadedData.length >= 100) {
            const lastRecord = allLoadedData.pop(); // xóa khỏi mảng

            // 🧹 Xóa record trên API thật
            await fetch(`${API_URL}/${lastRecord.id}`, { method: "DELETE" });
            console.log(`Đã xóa record có id: ${lastRecord.id}`);

            // Xóa khỏi DOM
            const lastTableRow = tableBodyElement.querySelector(`tr[data-id="${lastRecord.id}"]`);
            if (lastTableRow) lastTableRow.remove();

            const lastCard = cardViewElement.querySelector(`.card[data-id="${lastRecord.id}"]`);
            if (lastCard) lastCard.remove();

            offset = allLoadedData.length;
        }

        // Thêm record mới
        // 🕐 Chờ 0.5 giây sau khi xóa để MockAPI cập nhật
        await new Promise(resolve => setTimeout(resolve, 500));

        // Thêm record mới
        const response = await fetch(`${API_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord)
        });


        if (!response.ok) {
            console.error("Lỗi khi thêm record:", await response.text());
            return;
        }

        const addedData = await response.json();

        // Thêm lên đầu allLoadedData và DOM
        allLoadedData.unshift(addedData);
        appendNewItems([addedData]);

        scrollContainer.scrollTop = 0; 
        console.log("Đã xóa record cuối và thêm record mới:", addedData);
    } catch (error) {
        console.error("Lỗi khi thao tác record:", error);
    }
}

async function addRecord(newData) {
    try {
        // Lấy danh sách record hiện có
        const response = await fetch(API_URL);
        const data = await response.json();

        // Nếu đủ 100 thì xóa trước 1 record
        if (data.length >= 100) {
            const firstRecordId = data[0].id;
            await fetch(`${API_URL}/${firstRecordId}`, { method: "DELETE" });
            console.log(`Đã xóa record có id: ${firstRecordId}`);
        }

        // Sau khi xóa xong mới thêm
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newData)
        });

        if (!res.ok) throw new Error("Không thể thêm record mới");
        const added = await res.json();
        console.log("Đã thêm record mới:", added);

    } catch (error) {
        console.error("Lỗi khi thêm record:", error);
    }
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
async function loadMoreData() {
    if (!moreDataAvailable || loading) return;
    loading = true;

    if (offset === 0) {
        loaderElement.style.display = "block";
    } else {
        loadMoreElement.style.display = "block";
    }

    const remainingItems = 100 - allLoadedData.length;
    const limit = nextBatchSize > remainingItems ? remainingItems : nextBatchSize;

    try {

        const response = await fetch(`${API_URL}?page=1&limit=${allLoadedData.length + limit}&sortBy=id&order=asc`);
        const allData = await response.json();

        const dataList = allData.slice(allLoadedData.length, allLoadedData.length + limit);

        if (dataList.length === 0) {
            moreDataAvailable = false;
        } else {
            allLoadedData = [...allLoadedData, ...dataList];
            appendNewItems(dataList);

            offset += dataList.length;
            nextBatchSize = doubleNext ? itemsPerPage * 2 : itemsPerPage; 
            doubleNext = !doubleNext;

            if (allLoadedData.length === dataList.length) {
                scrollContainer.style.display = "block";
                loaderElement.style.display = "none";
            }
        }
    } catch (error) {
        console.error(error);
        moreDataAvailable = false;
    }

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
loadMoreData().then(() => {
    deleteLastAndAddRecord(newRecord);
});


