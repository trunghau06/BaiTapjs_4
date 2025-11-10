const API_URL          = "https://671891927fc4c5ff8f49fcac.mockapi.io/v2";
let currentPage        = 1;
const itemsPerPage     = 15; 
let allLoadedData      = [];
let loading            = false;
let moreDataAvailable  = true;

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

// kiem tra xem co phai mobile view khong
function checkMobileView() 
{
    return window.innerWidth <= 768;
}

async function deleteFirstRecord() 
{
  try 
  {
    if (allLoadedData.length === 0) return; 

    const firstRecord        = allLoadedData[0];

    const response           = await fetch(`${API_URL}/${firstRecord.id}`, { method: "DELETE" });

    if (response.ok) 
    {
        console.log(`Đã xóa record đầu tiên có id: ${firstRecord.id}`);

        allLoadedData.shift();

        renderTable(allLoadedData);
    } 
    else 
        console.error(`Lỗi khi xóa id ${firstRecord.id}:`, await response.text());
  } 
  catch (error) 
  {
        console.error("Lỗi khi xóa record đầu tiên:", error);
  }
}


async function addNewRecordAtStart(record) 
{
    try 
    {
    const response = await fetch(API_URL, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(record)
    });
    const addedData = await response.json();

    allLoadedData.unshift(addedData);

    // Render lại table và card view
    renderTable(allLoadedData);

    alert("Thêm record thành công!");
    } 
    catch (error) 
    {
        console.error("Lỗi khi thêm record:", error);
        alert("Lỗi khi thêm record!");
    }
}

// Mở modal thêm record
addRecordBtn.addEventListener("click", () => {
    addRecordModal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
});

cancelBtn.addEventListener("click", () => {
    addRecordModal.style.display = "none";
    addRecordForm.reset();
    resetAvatarPreview();
});

// Đóng modal khi click bên ngoài
addRecordModal.addEventListener("click", (e) => {
    if (e.target === addRecordModal) {
        addRecordModal.style.display = "none";
        addRecordForm.reset();
        resetAvatarPreview();
    }
});

// Preview avatar khi chọn file
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

// Reset preview về icon mặc định
function resetAvatarPreview() {
    avatarPreview.innerHTML = '<i class="fa-solid fa-user" style="font-size: 40px; color: #ccc;"></i>';
}

// Submit form thêm record
addRecordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData   = new FormData(addRecordForm);
    const avatarFile = formData.get("avatarFile");
    
    let avatarUrl    = "";
    
    // Convert ảnh sang base64
    if (avatarFile && avatarFile.size > 0) {
        try {
            avatarUrl = await resizeImage(avatarFile, 80, 80);
        } catch (error) {
            console.error("Lỗi convert ảnh:", error);
            alert("Lỗi khi xử lý ảnh!");
            return;
        }
    } else {
        alert("Vui lòng chọn ảnh avatar!");
        return;
    }
    
    const newRecord = {
        avatar   : avatarUrl,
        name     : formData.get("name"),
        company  : formData.get("company"),
        genre    : formData.get("genre"),
        email    : formData.get("email"),
        phone    : formData.get("phone"),
        dob      : formData.get("dob"),
        color    : formData.get("color"),
        timezone : formData.get("timezone"),
        music    : formData.get("music"),
        city     : formData.get("city"),
        state    : formData.get("state"),
        address  : formData.get("address"),
        street   : formData.get("street"),
        building : formData.get("building"),
        zip      : formData.get("zip"),
        password : formData.get("password"),
        createdAt: new Date().toISOString()
    };
    
    await addNewRecordAtStart(newRecord);
    
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

                if (width > maxWidth) {
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
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


function renderTable(data) 
{
    tableBodyElement.innerHTML = "";
    cardViewElement.innerHTML  = "";

    appendNewItems(data);
}

async function editRecordById(id, updates) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi sửa record id ${id}: ${response.status}`);
    }

    const updatedData = await response.json();
    console.log(`Record id ${id} đã được cập nhật:`, updatedData);

    // Cập nhật mảng local allLoadedData
    const index = allLoadedData.findIndex(item => item.id == id);
    if (index !== -1) {
      allLoadedData[index] = updatedData;
      renderTable(allLoadedData); 
    }
  } catch (error) {
    console.error(error);
  }
}

// editRecordById(20, { name: "Ten do Hau edit", genre: "male" });

// cap nhat che do hien thi theo mobile hay desktop
function switchViewMode() 
{
    if (checkMobileView()) 
    {
        tableSection.style.display                     = 'none';
        cardSection.style.display                      = 'flex';
        if (fakeScrollBar) fakeScrollBar.style.display = 'none';
    } 
    else 
    {
        tableSection.style.display                     = 'block';
        cardSection.style.display                      = 'none';
        if (fakeScrollBar) fakeScrollBar.style.display = 'block';
    }
}

// load them du lieu tu API
async function loadMoreData() 
{
    if (!moreDataAvailable || loading) return;
    loading = true;

    if (currentPage === 1) 
        loaderElement.style.display   = "block";
    else 
        loadMoreElement.style.display = "block";

    try {
        const response = await fetch(`${API_URL}?page=${currentPage}&limit=${itemsPerPage}&sortBy=id&order=asc`);
        const dataList = await response.json();

        if (dataList.length === 0) 
            moreDataAvailable = false;
        else 
        {
            allLoadedData = [...allLoadedData, ...dataList];
            appendNewItems(dataList);

            currentPage++; // Tăng page cho lần load tiếp theo

            if (currentPage === 2) 
            {
                scrollContainer.style.display = "block";
                loaderElement.style.display   = "none";
            }
        }
    } 
    catch (error) 
    {
        console.error(error);
        moreDataAvailable = false;
    }

    if (!moreDataAvailable || allLoadedData.length >= 100) 
    {
        loadMoreElement.style.display = "none";
        loading                       = false;
    } 
    else 
    {
        setTimeout(() => {
            loadMoreElement.style.display = "none";
            loading                       = false;
        }, 500);
    }
}

// them cac phan tu moi vao table va card view
function appendNewItems(dataList) 
{
    dataList.forEach(user => {
        // Table
        const tableRow     = document.createElement("tr");
        tableRow.setAttribute("data-id", user.id);
        tableRow.className = "data-row";
        tableRow.style.backgroundColor = user.color || "#FFFFFF";

        const isGenderMale     = user.genre?.toLowerCase()   === 'male';
        const genderBadgeClass = isGenderMale ? 'badge-male' : 'badge-female';
        const genderLabel      = isGenderMale ? 'Nam'        : 'Nữ';
        const genderIconClass  = isGenderMale ? 'fa-mars'    : 'fa-venus';

        tableRow.innerHTML = `
            <td>${user.id               || 'N/A'}</td>
            <td><img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="${user.name}" class="avatar-small" loading="lazy"></td>
            <td>${user.name             || 'N/A'}</td>
            <td>${user.company          || 'N/A'}</td>
            <td>
                <span class="card-badge ${genderBadgeClass}">
                    <i class="fa-solid ${genderIconClass}"></i> ${genderLabel}
                </span>
            </td>
            <td>${user.email    || 'N/A'}</td>
            <td>${user.phone    || 'N/A'}</td>
            <td>${user.dob      || 'N/A'}</td>
            <td>${user.color    || 'N/A'}</td>
            <td>${user.timezone || 'N/A'}</td>
            <td>${user.music    || 'N/A'}</td>
            <td>${user.city     || 'N/A'}</td>
            <td>${user.state    || 'N/A'}</td>
            <td>${user.address  || 'N/A'}</td>
            <td>${user.street   || 'N/A'}</td>
            <td>${user.building || 'N/A'}</td>
            <td>${user.zip      || user.zipcode || 'N/A'}</td>
            <td>${user.createdAt|| 'N/A'}</td>
            <td>${user.password || 'N/A'}</td>
        `;
        tableBodyElement.appendChild(tableRow);

        // Card
        const cardElement                 = document.createElement("div");
        cardElement.setAttribute("data-id", user.id);
        cardElement.className             = "card";
        cardElement.style.backgroundColor = user.color || "#FFFFFF";

        const displayGender = isGenderMale ? 'Nam' : 'Nữ';

        cardElement.innerHTML = `
            <div class="card-header">
                <img src="${user.avatar                      || 'https://via.placeholder.com/60'}" alt="${user.name}" class="avatar" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${user.name       || 'N/A'}</div>
                    <div class="card-company">${user.company || 'N/A'}</div>
                </div>
                <span class="card-badge ${genderBadgeClass}">
                    ${displayGender}
                </span>
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
    });
}

scrollContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

    if (scrollTop + clientHeight >= scrollHeight - 1) 
    {
        if (moreDataAvailable) 
        {
            loadMoreElement.style.display                               = "block";
            loadMoreElement.querySelector('div:last-child').textContent = `...`;
            loadMoreData();
        } 
        else 
            loadMoreElement.style.display = "none";
    }
});

window.addEventListener('resize', () => {
    switchViewMode();
});

if (fakeScrollBar) 
{
    fakeScrollBar.addEventListener('scroll', () => {
        scrollContainer.scrollLeft = fakeScrollBar.scrollLeft;
    });
    
    scrollContainer.addEventListener('scroll', () => {
        if (!checkMobileView()) 
            fakeScrollBar.scrollLeft = scrollContainer.scrollLeft;
    });
}


// khoi tao view va load batch dau tien
switchViewMode();
loadMoreData();
