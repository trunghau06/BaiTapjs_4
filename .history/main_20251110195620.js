const API_URL          = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage        = 1;
const itemsPerPage     = 15; 
let allLoadedData      = [];
let loading            = false;
let moreDataAvailable  = true;
let isEditMode         = false;
let editingUser        = null;

 const columnGroups = [
            ['actions', 'id', 'name', 'company', 'genre', 'email', 'phone'],
            ['actions', 'id', 'dob', 'color', 'timezone', 'music', 'avatar'],
            ['actions', 'id', 'city', 'state', 'address', 'street', 'building'],
            ['actions', 'id', 'zip', 'createdAt', 'password']
        ];
        
        let currentColumnGroup = 0;
        
        const columnLabels = {
            'actions': '',
            'id': 'ID',
            'avatar': 'Avatar',
            'name': 'Name',
            'company': 'Company',
            'genre': 'Genre',
            'email': 'Email',
            'phone': 'Phone',
            'dob': 'DOB',
            'color': 'Color',
            'timezone': 'Timezone',
            'music': 'Music',
            'city': 'City',
            'state': 'State',
            'address': 'Address',
            'street': 'Street',
            'building': 'Building',
            'zip': 'ZIP',
            'createdAt': 'CreatedAt',
            'password': 'Password'
        };

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

// Column Pagination Function
function updateTableColumns() {
    const columns = columnGroups[currentColumnGroup];
    const table = document.querySelector('.data-table');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    // Update header
    thead.innerHTML = '';
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = columnLabels[col];
        thead.appendChild(th);
    });
    
    // Update body rows
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const userId = row.getAttribute('data-id');
        const userData = allLoadedData.find(u => u.id == userId);
        if (!userData) return;
        
        const bgColor = lightenColor(userData.color || "#FFFFFF", 70);
        row.style.backgroundColor = bgColor;
        
        const isGenderMale = userData.genre?.toLowerCase() === 'male';
        const genderBadgeClass = isGenderMale ? 'badge-male' : 'badge-female';
        const genderLabel = isGenderMale ? 'Nam' : 'Nữ';
        const genderIconClass = isGenderMale ? 'fa-mars' : 'fa-venus';
        
        row.innerHTML = '';
        columns.forEach(col => {
            const td = document.createElement('td');
            
            if (col === 'actions') {
                td.style.textAlign = "center";
                td.innerHTML = `
                    <button class="btn-action edit-icon" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-action delete-icon" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
            } else if (col === 'avatar') {
                td.innerHTML = `<img src="${userData.avatar || 'https://via.placeholder.com/40'}" alt="${userData.name}" class="avatar-small">`;
            } else if (col === 'genre') {
                td.innerHTML = `<span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>`;
            } else if (col === 'color') {
                td.textContent = userData[col] || 'N/A';
            } else if (col === 'password') {
                td.textContent = userData[col] || 'N/A';
            } else {
                td.textContent = userData[col] || 'N/A';
            }
            
            row.appendChild(td);
        });
        
        // Re-attach event listeners
        const editBtn = row.querySelector('.edit-icon');
        const deleteBtn = row.querySelector('.delete-icon');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => openEditModal(userData));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (!confirm(`Bạn chắc chắn muốn xóa record id ${userData.id}?`)) return;
                try {
                    const res = await fetch(`${API_URL}/${userData.id}`, { method: "DELETE" });
                    if (res.ok) {
                        allLoadedData = allLoadedData.filter(u => u.id != userData.id);
                        row.remove();
                        const card = cardViewElement.querySelector(`.card[data-id='${userData.id}']`);
                        if (card) card.remove();
                        console.log(`Đã xóa record`);
                    } else alert("Xóa thất bại!");
                } catch (err) {
                    console.error(err);
                    alert("Lỗi khi xóa record!");
                }
            });
        }
    });
}

async function addNewRecordAtStart(record) {
    try {
        const response  = await fetch(API_URL, {
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

addRecordBtn.addEventListener("click", () => {
    isEditMode = false;
    editingUser = null;
    addRecordModal.style.display = "flex";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
});

closeModalBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
});

cancelBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
    submitBtn.textContent = "Thêm Record";
});

addRecordModal.addEventListener("click", (e) => {
    if (e.target === addRecordModal) {
        addRecordModal.style.display = "none";
        addRecordForm.reset();
        resetAvatarPreview();
        submitBtn.textContent = "Thêm Record";
    }
});

avatarFileInput.addEventListener("change", (e) => {
    const file        = e.target.files[0];
    if (file) {
        const reader  = new FileReader();
        reader.onload = (event) => {
            avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

function resetAvatarPreview() {
    avatarPreview.innerHTML = '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';
}

addRecordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData   = new FormData(addRecordForm);

    let avatarUrl    = editingUser?.avatar || ""; 
    const avatarFile = formData.get("avatarFile");

    if (!isEditMode) {
        if (!avatarFile || avatarFile.size === 0) {
            alert("Vui lòng chọn ảnh avatar!");
            return;
        }
        avatarUrl     = await resizeImage(avatarFile, 80, 80);
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

    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
});

function resizeImage(file, maxWidth = 80, maxHeight = 80) {
    return new Promise((resolve, reject) => {
        const reader   = new FileReader();
        reader.onload  = (event) => {
            const img  = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width  > maxWidth) {
                    height = height * (maxWidth / width);
                    width  = maxWidth;
                }
                if (height > maxHeight) {
                    width  = width * (maxHeight / height);
                    height = maxHeight;
                }
                const canvas  = document.createElement("canvas");
                canvas.width  = width;
                canvas.height = height;
                const ctx     = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            img.src     = event.target.result;
        };
        reader.onerror  = reject;
        reader.readAsDataURL(file);
    });
}

function renderTable(data) {
    tableBodyElement.innerHTML = "";
    cardViewElement.innerHTML  = "";
    appendNewItems(data);
    updateTableColumns();
}

async function editRecordById(id, updates) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method : "PUT",
            headers: { "Content-Type": "application/json" },
            body   : JSON.stringify(updates)
        });
        if (!response.ok) {
            throw new Error(`Lỗi khi sửa record id ${id}: ${response.status}`);
        }
        const updatedData = await response.json();
        console.log(`Record id ${id} đã được cập nhật:`, updatedData);
        const index = allLoadedData.findIndex(item => item.id == id);
        if (index  !== -1) {
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
    if (!moreDataAvailable || loading) return;
    loading = true;

    if (currentPage    === 1) loaderElement.style.display = "block";
    else loadMoreElement.style.display = "block";

    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${itemsPerPage}&sortBy=id&order=asc`);
        const dataList = await response.json();
        if (dataList.length === 0) moreDataAvailable = false;
        else {
            allLoadedData   = [...allLoadedData, ...dataList];
            appendNewItems(dataList);
            currentPage++;
            if (currentPage === 2) {
                scrollContainer.style.display = "block";
                loaderElement.style.display   = "none";
                updateTableColumns();
            }
        }
    } catch (error) {
        console.error(error);
        moreDataAvailable = false;
    }

    if (!moreDataAvailable || allLoadedData.length >= 100) {
        loadMoreElement.style.display = "none";
        loading     = false;
    } else {
        setTimeout(() => {
            loadMoreElement.style.display = "none";
            loading = false;
        }, 500);
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

function appendNewItems(dataList) {
    dataList.forEach(user => {
        const isGenderMale     = user.genre?.toLowerCase() === 'male';
        const genderBadgeClass = isGenderMale ? 'badge-male' : 'badge-female';
        const genderLabel      = isGenderMale ? 'Nam'        : 'Nữ';
        const genderIconClass  = isGenderMale ? 'fa-mars'    : 'fa-venus';

        const tableRow     = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        const bgColor   = lightenColor(user.color || "#FFFFFF", 70);
        tableRow.style.backgroundColor = bgColor;

        const cells = [
            user.id                  || 'N/A',
            `<img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small">`,
            user.name                || 'N/A',
            user.company             || 'N/A',
            `<span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>`,
            user.email               || 'N/A',
            user.phone               || 'N/A',
            user.dob                 || 'N/A',
            user.color               || 'N/A',
            user.timezone            || 'N/A',
            user.music               || 'N/A',
            user.city                || 'N/A',
            user.state               || 'N/A',
            user.address             || 'N/A',
            user.street              || 'N/A',
            user.building            || 'N/A',
            user.zip                 || user.zipcode || 'N/A',
            user.createdAt           || 'N/A',
            user.password            || 'N/A'
        ];

        cells.forEach(content => {
            const td     = document.createElement("td");
            td.innerHTML = content;
            tableRow.appendChild(td);
        });

        const actionTd = document.createElement("td");
        actionTd.style.textAlign = "center";
        actionTd.innerHTML = `
            <button class="btn-action edit-icon" title="Chỉnh sửa">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-action delete-icon" title="Xóa">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        tableRow.prepend(actionTd); 
        tableBodyElement.appendChild(tableRow);

        actionTd.querySelector(".delete-icon").addEventListener("click", async () => {
            if (!confirm(`Bạn chắc chắn muốn xóa record id ${user.id}?`)) return;
            try {
                const res         = await fetch(`${API_URL}/${user.id}`, { method: "DELETE" });
                if (res.ok) {
                    allLoadedData = allLoadedData.filter(u => u.id != user.id);

                    tableRow.remove();

                    const card    = cardViewElement.querySelector(`.card[data-id='${user.id}']`);

                    if (card) card.remove();

                    console.log(`Đã xóa record`);
                } else alert("Xóa thất bại!");
            } catch (err) {
                console.error(err);
                alert("Lỗi khi xóa record!");
            }
        });

        actionTd.querySelector(".edit-icon").addEventListener("click", () => openEditModal(user));

        if (!cardViewElement.querySelector(`.card[data-id='${user.id}']`)) {
            const cardElement     = document.createElement("div");
            cardElement.setAttribute("data-id", user.id);
            cardElement.className = "card";
            cardElement.style.backgroundColor = user.color || "#FFFFFF";

            const isMale          = user.genre?.toLowerCase() === 'male';
            const genderBadgeClass= isMale ? 'badge-male' : 'badge-female';
            const displayGender   = isMale ? 'Nam' : 'Nữ';

            cardElement.innerHTML = `
                <button class="btn-action edit-icon" title="Chỉnh sửa">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action delete-icon" title="Xóa">
                    <i class="fa-solid fa-trash"></i>
                </button>

                <div class="card-header">
                    <img src="${user.avatar                      || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar">
                    <div class="card-info">
                        <div class="card-name">${user.name       || 'N/A'}</div>
                        <div class="card-company">${user.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${genderBadgeClass}"><i class="fa-solid ${genderIconClass}"></i> ${genderLabel}</span>
                </div>

                <div class="card-body">
                    <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${user.id                       || 'N/A'}</div>
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${user.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${user.name                       || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${user.genre               || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${user.company             || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${user.dob                || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> ${user.color                  || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${user.timezone              || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${user.music                    || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${user.address     || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${user.city                       || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map card-icon"></i> <strong>State:</strong> ${user.state                      || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-road card-icon"></i> <strong>Street:</strong> ${user.street                   || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building-columns card-icon"></i> <strong>Building:</strong> ${user.building   || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-hashtag card-icon"></i> <strong>ZIP:</strong> ${user.zip                      || user.zipcode || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${user.email                 || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${user.phone                    || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-lock card-icon"></i> <strong>Password:</strong> ${user.password               || 'N/A'}</div>
                </div>
            `;
            cardViewElement.appendChild(cardElement);

            const editIcon   = cardElement.querySelector(".edit-icon");
            const deleteIcon = cardElement.querySelector(".delete-icon");

            editIcon.addEventListener("click", () => openEditModal(user));
            deleteIcon.addEventListener("click", async () => {
                if (!confirm(`Bạn chắc chắn muốn xóa record id ${user.id}?`)) return;
                try {
                    const res         = await fetch(`${API_URL}/${user.id}`, { method: "DELETE" });
                    if (res.ok) {
                        allLoadedData = allLoadedData.filter(u => u.id != user.id);
                        cardElement.remove();
                        const row     = tableBodyElement.querySelector(`tr[data-id='${user.id}']`);
                        if (row) row.remove();
                        console.log(`Đã xóa record`);
                    } else alert("Xóa thất bại!");
                } catch (err) {
                    console.error(err);
                    alert("Lỗi khi xóa record!");
                }
            });
        }
    });
}

function openEditModal(user) {
    isEditMode  = true;
    editingUser = user;
    addRecordModal.style.display = "flex";

    addRecordForm.name.value     = user.name     || "";
    addRecordForm.company.value  = user.company  || "";
    addRecordForm.genre.value    = user.genre    || "";
    addRecordForm.email.value    = user.email    || "";
    addRecordForm.phone.value    = user.phone    || "";
    if (user.dob) {
        addRecordForm.dob.value  = new Date(user.dob).toISOString().slice(0,16);
    } else {
        addRecordForm.dob.value  = "";
    }
    addRecordForm.color.value    = user.color ? user.color : "#ffffff";
    addRecordForm.timezone.value = user.timezone || "";
    addRecordForm.music.value    = user.music    || "";
    addRecordForm.city.value     = user.city     || "";
    addRecordForm.state.value    = user.state    || "";
    addRecordForm.address.value  = user.address  || "";
    addRecordForm.street.value   = user.street   || "";
    addRecordForm.building.value = user.building || "";
    addRecordForm.zip.value      = user.zip      || user.zipcode || "";
    addRecordForm.password.value = user.password || "";

    avatarPreview.innerHTML = user.avatar
        ? `<img src="${user.avatar}" alt="Preview">`
        : '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';

    submitBtn.textContent = "Chỉnh sửa";
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

// Pagination buttons for columns
document.querySelector('.pagination-prev-btn').addEventListener('click', () => {
    if (currentColumnGroup > 0) {
        currentColumnGroup--;
        updateTableColumns();
    }
});

document.querySelector('.pagination-next-btn').addEventListener('click', () => {
    if (currentColumnGroup < columnGroups.length - 1) {
        currentColumnGroup++;
        updateTableColumns();
    }
});

window.addEventListener('resize', () => {
    switchViewMode();
});

switchViewMode();
loadMoreData();