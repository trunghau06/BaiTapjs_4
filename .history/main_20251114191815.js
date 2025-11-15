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

function checkMobileView() {
    return window.innerWidth <= 768;
}

function resetAvatarPreview() {
    avatarPreview.innerHTML = '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';
}

function openAddModal() {
    isEditMode = false;
    editingUser = null;
    addRecordModal.style.display = "flex";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
    addRecordModal.querySelector("h2").textContent = "Thêm Record Mới";
}

function closeModal() {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
}

addRecordBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
addRecordModal.addEventListener("click", (e) => {
    if (e.target === addRecordModal) closeModal();
});

avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

addRecordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addRecordForm);

    let avatarUrl = editingUser?.avatar || ""; 
    const avatarFile = formData.get("avatarFile");

    if (!isEditMode) {
        if (!avatarFile || avatarFile.size === 0) {
            alert("Vui lòng chọn ảnh avatar!");
            return;
        }
        avatarUrl = await resizeImage(avatarFile, 80, 80);
    } else {
        if (avatarFile && avatarFile.size > 0) {
            avatarUrl = await resizeImage(avatarFile, 80, 80);
        }
    }

    const recordData = {
        avatar   : avatarUrl,
        name     : formData.get("name"),
        color    : formData.get("color") || editingUser?.color || "#ffffff",
        company  : formData.get("company"),
        genre    : formData.get("genre"),
        email    : formData.get("email"),
        phone    : formData.get("phone"),
        dob      : formData.get("dob"),
        timezone : formData.get("timezone"),
        music    : formData.get("music"),
        city     : formData.get("city"),
        state    : formData.get("state"),
        address  : formData.get("address"),
        street   : formData.get("street"),
        building : formData.get("building"),
        zip      : formData.get("zip"),
        password : formData.get("password"),
        createdAt: isEditMode ? editingUser.createdAt : new Date().toISOString()
    };

    if (isEditMode) {
        await editRecordById(editingUser.id, recordData);
    } else {
        await addNewRecordAtStart(recordData);
    }

    closeModal();
});

async function addNewRecordAtStart(record) {
    try {
        const response = await fetch(API_URL, {
            method : "POST",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(record)
        });
        const addedData = await response.json();
        allLoadedData.unshift(addedData);
        renderTable(allLoadedData);
    } catch (error) {
        console.error("Lỗi khi thêm record:", error);
        alert("Lỗi khi thêm record!");
    }
}

function resizeImage(file, maxWidth = 80, maxHeight = 80) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function editRecordById(id, updates) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method : "PUT",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(updates)
        });
        if (!response.ok) throw new Error(`Lỗi khi sửa record id ${id}: ${response.status}`);
        const updatedData = await response.json();
        const index = allLoadedData.findIndex(item => item.id == id);
        if (index !== -1) {
            allLoadedData[index] = updatedData;
            renderTable(allLoadedData);
        }
    } catch (error) {
        console.error(error);
    }
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

async function loadMoreData() {
    if (loading || !moreDataAvailable) return;
    loading = true;

    if (currentPage === 1) loaderElement.style.display = "block";
    else loadMoreElement.style.display = "block";

    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${itemsPerPage}&sortBy=id&order=asc`);
        const dataList = await response.json();
        
        console.log(`Page ${currentPage} loaded:`, dataList.length, "records");
        
        if (dataList.length === 0) {
            moreDataAvailable = false;
        } else {
            allLoadedData = dataList;
            
            // Luôn render bình thường - renderTable sẽ tự xử lý
            renderTable(allLoadedData);
            currentPage++;
        }
    } catch (err) {
        console.error("Load error:", err);
        moreDataAvailable = false;
    } finally {
        loaderElement.style.display = "none";
        loadMoreElement.style.display = "none";
        loading = false;
    }
}

function lightenColor(hexColor, percent) {
    hexColor = hexColor.replace("#","");
    let r = parseInt(hexColor.substring(0,2),16);
    let g = parseInt(hexColor.substring(2,4),16);
    let b = parseInt(hexColor.substring(4,6),16);
    r = Math.min(255, Math.floor(r + (255 - r) * percent/100));
    g = Math.min(255, Math.floor(g + (255 - g) * percent/100));
    b = Math.min(255, Math.floor(b + (255 - b) * percent/100));
    return `rgb(${r},${g},${b})`;
}

function renderTable(data) {
    const isFirstRender = tableBodyElement.children.length === 0;
    
    if (isFirstRender) {
        // Lần đầu: tạo 15 hàng cố định
        tableBodyElement.innerHTML = "";
        cardViewElement.innerHTML = "";
        appendNewItems(data);
    } else {
        // Các lần sau: chỉ cập nhật nội dung
        updateExistingRows(data);
    }
}

// Hàm MỚI: Cập nhật nội dung các hàng đã có
function updateExistingRows(dataList) {
    const existingRows = tableBodyElement.querySelectorAll("tr.data-row");
    const existingCards = cardViewElement.querySelectorAll(".card");

    dataList.forEach((user, index) => {
        if (index < existingRows.length) {
            updateSingleRow(existingRows[index], user);
        }
        if (index < existingCards.length) {
            updateSingleCard(existingCards[index], user);
        }
    });
}

function updateSingleRow(tableRow, user) {
    const isMale = user.genre?.toLowerCase() === 'male';
    const genderBadgeClass = isMale ? 'badge-male' : 'badge-female';
    const genderLabel = isMale ? 'Nam' : 'Nữ';
    const genderIconClass = isMale ? 'fa-mars' : 'fa-venus';

    tableRow.setAttribute("data-id", user.id);
    tableRow.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);

    const cells = [
        user.id,
        `<img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small">`,
        user.name, user.company,
        `<span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>`,
        user.email, user.phone, user.dob, user.color, user.timezone, user.music,
        user.city, user.state, user.address, user.street, user.building,
        user.zip || user.zipcode, user.createdAt, user.password
    ];

    // Bỏ qua cột đầu tiên (action buttons)
    const tds = tableRow.querySelectorAll("td");
    cells.forEach((content, i) => {
        if (tds[i + 1]) {
            tds[i + 1].innerHTML = content || "N/A";
        }
    });

    // Cập nhật event listeners
    const editIcon = tableRow.querySelector(".edit-icon");
    const deleteIcon = tableRow.querySelector(".delete-icon");
    
    // Xóa listeners cũ bằng cách clone và replace
    const newEditIcon = editIcon.cloneNode(true);
    const newDeleteIcon = deleteIcon.cloneNode(true);
    editIcon.replaceWith(newEditIcon);
    deleteIcon.replaceWith(newDeleteIcon);
    
    newEditIcon.addEventListener("click", () => openEditModal(user));
    newDeleteIcon.addEventListener("click", async () => await deleteRecord(user));
}

function updateSingleCard(cardElement, user) {
    const isMale = user.genre?.toLowerCase() === 'male';
    const genderBadgeClass = isMale ? 'badge-male' : 'badge-female';
    const genderLabel = isMale ? 'Nam' : 'Nữ';
    const genderIconClass = isMale ? 'fa-mars' : 'fa-venus';

    cardElement.setAttribute("data-id", user.id);
    cardElement.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);

    cardElement.innerHTML = `
        <div class="card-header">
            <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar">
            <div class="card-info">
                <div class="card-name">${user.name || 'N/A'}</div>
                <div class="card-company">${user.company || 'N/A'}</div>
            </div>
            <span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>
        </div>
        <div class="card-body">
            <div class="card-item"><strong>ID:</strong> ${user.id || 'N/A'}</div>
            <div class="card-item"><strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
            <div class="card-item"><strong>Name:</strong> ${user.name || 'N/A'}</div>
            <div class="card-item"><strong>Genre:</strong> ${user.genre || 'N/A'}</div>
            <div class="card-item"><strong>Company:</strong> ${user.company || 'N/A'}</div>
            <div class="card-item"><strong>DOB:</strong> ${user.dob || 'N/A'}</div>
            <div class="card-item"><strong>Color:</strong> ${user.color || 'N/A'}</div>
            <div class="card-item"><strong>Timezone:</strong> ${user.timezone || 'N/A'}</div>
            <div class="card-item"><strong>Music:</strong> ${user.music || 'N/A'}</div>
            <div class="card-item"><strong>Address:</strong> ${user.address || 'N/A'}</div>
            <div class="card-item"><strong>City:</strong> ${user.city || 'N/A'}</div>
            <div class="card-item"><strong>State:</strong> ${user.state || 'N/A'}</div>
            <div class="card-item"><strong>Street:</strong> ${user.street || 'N/A'}</div>
            <div class="card-item"><strong>Building:</strong> ${user.building || 'N/A'}</div>
            <div class="card-item"><strong>ZIP:</strong> ${user.zip || user.zipcode || 'N/A'}</div>
            <div class="card-item"><strong>Email:</strong> ${user.email || 'N/A'}</div>
            <div class="card-item"><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
            <div class="card-item"><strong>Password:</strong> ${user.password || 'N/A'}</div>
        </div>
        <div class="card-actions">
            <button class="btn-action edit-icon" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-action delete-icon" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    
    attachCardEvents(cardElement, user);
}

function appendNewItems(dataList) {
    dataList.forEach(user => {
        const isMale = user.genre?.toLowerCase() === 'male';
        const genderBadgeClass = isMale ? 'badge-male' : 'badge-female';
        const genderLabel = isMale ? 'Nam' : 'Nữ';
        const genderIconClass = isMale ? 'fa-mars' : 'fa-venus';

        // TABLE ROW
        const tableRow = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        tableRow.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);

        const cells = [
            user.id,
            `<img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small">`,
            user.name, user.company,
            `<span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>`,
            user.email, user.phone, user.dob, user.color, user.timezone, user.music,
            user.city, user.state, user.address, user.street, user.building,
            user.zip || user.zipcode, user.createdAt, user.password
        ];

        cells.forEach(content => {
            const td = document.createElement("td");
            td.innerHTML = content || "N/A";
            tableRow.appendChild(td);
        });

        const actionTd = document.createElement("td");
        actionTd.style.textAlign = "center";
        actionTd.innerHTML = `
            <button class="btn-action edit-icon" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-action delete-icon" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        `;
        tableRow.prepend(actionTd);
        tableBodyElement.appendChild(tableRow);

        attachRowEvents(tableRow, user);

        // CARD VIEW
        if (!cardViewElement.querySelector(`.card[data-id='${user.id}']`)) {
            const card = document.createElement("div");
            card.className = "card";
            card.setAttribute("data-id", user.id);
            card.style.backgroundColor = lightenColor(user.color || "#FFFFFF", 70);

            card.innerHTML = `
                <div class="card-header">
                    <img src="${user.avatar || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar">
                    <div class="card-info">
                        <div class="card-name">${user.name || 'N/A'}</div>
                        <div class="card-company">${user.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>
                </div>
                <div class="card-body">
                    <div class="card-item"><strong>ID:</strong> ${user.id || 'N/A'}</div>
                    <div class="card-item"><strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
                    <div class="card-item"><strong>Name:</strong> ${user.name || 'N/A'}</div>
                    <div class="card-item"><strong>Genre:</strong> ${user.genre || 'N/A'}</div>
                    <div class="card-item"><strong>Company:</strong> ${user.company || 'N/A'}</div>
                    <div class="card-item"><strong>DOB:</strong> ${user.dob || 'N/A'}</div>
                    <div class="card-item"><strong>Color:</strong> ${user.color || 'N/A'}</div>
                    <div class="card-item"><strong>Timezone:</strong> ${user.timezone || 'N/A'}</div>
                    <div class="card-item"><strong>Music:</strong> ${user.music || 'N/A'}</div>
                    <div class="card-item"><strong>Address:</strong> ${user.address || 'N/A'}</div>
                    <div class="card-item"><strong>City:</strong> ${user.city || 'N/A'}</div>
                    <div class="card-item"><strong>State:</strong> ${user.state || 'N/A'}</div>
                    <div class="card-item"><strong>Street:</strong> ${user.street || 'N/A'}</div>
                    <div class="card-item"><strong>Building:</strong> ${user.building || 'N/A'}</div>
                    <div class="card-item"><strong>ZIP:</strong> ${user.zip || user.zipcode || 'N/A'}</div>
                    <div class="card-item"><strong>Email:</strong> ${user.email || 'N/A'}</div>
                    <div class="card-item"><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
                    <div class="card-item"><strong>Password:</strong> ${user.password || 'N/A'}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-action edit-icon" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action delete-icon" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            cardViewElement.appendChild(card);
            attachCardEvents(card, user);
        }
    });
}

function attachRowEvents(tableRow, user) {
    const editIcon = tableRow.querySelector(".edit-icon");
    const deleteIcon = tableRow.querySelector(".delete-icon");

    editIcon.addEventListener("click", () => openEditModal(user));
    deleteIcon.addEventListener("click", async () => await deleteRecord(user));
}

function attachCardEvents(cardElement, user) {
    const editIcon = cardElement.querySelector(".edit-icon");
    const deleteIcon = cardElement.querySelector(".delete-icon");

    editIcon.addEventListener("click", () => openEditModal(user));
    deleteIcon.addEventListener("click", async () => await deleteRecord(user));
}

async function deleteRecord(user) {
    if (!confirm(`Bạn chắc chắn muốn xóa record id ${user.id}?`)) return;
    try {
        const res = await fetch(`${API_URL}/${user.id}`, { method: "DELETE" });
        if (res.ok) {
            allLoadedData = allLoadedData.filter(u => u.id != user.id);
            const row = tableBodyElement.querySelector(`tr[data-id='${user.id}']`);
            if (row) row.remove();
            const card = cardViewElement.querySelector(`.card[data-id='${user.id}']`);
            if (card) card.remove();
        } else alert("Xóa thất bại!");
    } catch (err) {
        console.error(err);
        alert("Lỗi khi xóa record!");
    }
}

function formatDobForInput(dobString) {
    if (!dobString) return "";
    
    let date = new Date(dobString);

    if (isNaN(date.getTime())) {
        const parts = dobString.split('-');
        if (parts.length === 3) {
            date = new Date(parts[0], parts[1]-1, parts[2]);
        } else return "";
    }

    const year    = date.getFullYear();
    const month   = String(date.getMonth() + 1).padStart(2, '0');
    const day     = String(date.getDate()).padStart(2, '0');
    const hours   = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function openEditModal(user) {
    isEditMode  = true;
    editingUser = user;
    addRecordModal.style.display = "flex";

    addRecordForm.name.value     = user.name || "";
    addRecordForm.company.value  = user.company || "";
    addRecordForm.genre.value    = user.genre || "";
    addRecordForm.email.value    = user.email || "";
    addRecordForm.phone.value    = user.phone || "";
    addRecordForm.dob.value      = formatDobForInput(user.dob);
    addRecordForm.color.value    = user.color || "#ffffff";
    addRecordForm.timezone.value = user.timezone || "";
    addRecordForm.music.value    = user.music || "";
    addRecordForm.city.value     = user.city || "";
    addRecordForm.state.value    = user.state || "";
    addRecordForm.address.value  = user.address || "";
    addRecordForm.street.value   = user.street || "";
    addRecordForm.building.value = user.building || "";
    addRecordForm.zip.value      = user.zip || user.zipcode || "";
    addRecordForm.password.value = user.password || "";

    avatarPreview.innerHTML = user.avatar
        ? `<img src="${user.avatar}" alt="Preview">`
        : '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';

    addRecordModal.querySelector("h2").textContent = "Chỉnh Sửa Record";
    submitBtn.textContent = "Chỉnh sửa";
}

scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollTop + clientHeight >= scrollHeight - 1) {
        if (moreDataAvailable) loadMoreData();
    }
});

// Load data ngay khi trang vừa mở
function initApp() {
    console.log("App initializing...");
    console.log("Table body:", tableBodyElement);
    console.log("Loader:", loaderElement);
    switchViewMode();
    loadMoreData();
}

// Thử cả 3 cách để đảm bảo chạy
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM đã load rồi, chạy luôn
    initApp();
}

// Xử lý khi resize window
window.addEventListener("resize", switchViewMode);