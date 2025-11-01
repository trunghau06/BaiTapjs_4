class ResponsiveVirtualView {
    constructor() {
        this.data = [];
        this.isMobileView = window.innerWidth <= 1024; // Xác định chế độ xem ban đầu
        this.cardsPerRow = 1; 
        this.visibleRows = 0;
        this.bufferRows = 5; 
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.rowHeight = 0; 
        
        this.renderedCardIds = new Set(); 

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        
        // Các container DOM cho chế độ Responsive
        this.tableBody = document.getElementById('tableBody'); 
        this.cardView = document.getElementById('cardView'); 
        this.tableView = document.getElementById('tableView'); 

        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');
        
        // Phần tử cho cuộn ngang đồng bộ
        this.table = document.querySelector('.data-table');
        this.fakeScroll = document.getElementById('fakeScroll');
        this.fakeWrapper = document.querySelector('.fake-scroll-wrapper');
        
        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        
        window.requestAnimationFrame(() => { 
            this.updateViewMode(); // Quyết định xem nên render Table hay Card
            
            // Đo đạc layout lần đầu (Row/Card Height)
            this.createTemporaryElement(); 
            this.calculateLayout(); 
            this.removeTemporaryElement(); 

            this.setupScrollListener(); 
            this.setupResizeListener(); 
            this.setupHorizontalSync(); // Thiết lập cuộn ngang đồng bộ
            this.render(); 
            this.loader.style.display = 'none';
        });
    }

    // --- LOGIC TẢI DỮ LIỆU (Giữ nguyên) ---
    async loadInitialData() { /* ... */
        const promises = [];
        for (let page = 1; page <= 5; page++) {
            promises.push(
                fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`)
                    .then(res => res.json())
            );
        }
        try {
            const results = await Promise.all(promises);
            this.data = results.flat();
            this.data.sort((a, b) => Number(a.id) - Number(b.id)); 
            this.currentPage = 6;
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadData() { /* ... */
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loadingMore.style.display = "block";

        try {
            const response = await fetch(
                `https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`
            );
            const newData = await response.json();

            if (newData.length === 0) {
                this.hasMore = false;
            } else {
                this.data = [...this.data, ...newData];
                this.data.sort((a, b) => Number(a.id) - Number(b.id)); 
                this.currentPage++;
                this.render(); 
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }
    
    // --- CÁC HÀM TIỆN ÍCH CHUYỂN ĐỔI ---

    updateViewMode() {
        this.isMobileView = window.innerWidth <= 1024;
        
        if (this.isMobileView) {
            this.cardsPerRow = 1; // Card list luôn là 1 phần tử/hàng
        } else {
            // Tắt/Bật cuộn ngang giả
            this.fakeWrapper.style.display = 'block'; 
            this.cardsPerRow = 1; // Bảng cũng là 1 hàng / row
        }
        
        // Buộc render lại layout và DOM khi chế độ xem thay đổi
        this.calculateLayout(); 
        this.render();
    }
    
    createTemporaryElement() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const className = this.isMobileView ? '.card' : '.data-row';

        if (this.data.length > 0 && !targetContainer.querySelector(className)) {
            const sampleElement = this.isMobileView 
                ? this.createCardElement(this.data[0]) 
                : this.createRowElement(this.data[0]);
                
            sampleElement.style.visibility = 'hidden'; 
            sampleElement.id = 'temp-el-for-measurement';
            targetContainer.appendChild(sampleElement);
        }
    }

    removeTemporaryElement() {
        const tempElement = document.getElementById('temp-el-for-measurement');
        if (tempElement) {
            tempElement.parentElement.removeChild(tempElement);
        }
    }

    calculateLayout() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const className = this.isMobileView ? '.card' : '.data-row';
        const gap = this.isMobileView ? 15 : 0; // Gap cho Card mode

        this.cardsPerRow = 1; // Luôn là 1 hàng cho cả Table và Card List (dọc)
        
        const firstElement = targetContainer.querySelector(className);
        
        if (firstElement) {
            const rect = firstElement.getBoundingClientRect();
            this.rowHeight = rect.height + gap; 
        } else {
            this.rowHeight = this.isMobileView ? 250 : 80; 
        }

        if (this.rowHeight > 0) {
            const containerHeight = this.cardsContainer.clientHeight;
            this.visibleRows = Math.ceil(containerHeight / this.rowHeight) + 1;
        } else {
            this.visibleRows = 10; 
            this.rowHeight = 80;
        }
    }

    setupScrollListener() {
        let scrollTimeout;
        this.cardsContainer.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.render();
                this.checkLoadMore();
            }, 16);
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const oldMode = this.isMobileView;
                this.updateViewMode();
                
                if (oldMode !== this.isMobileView) {
                     // Nếu chế độ xem thay đổi, buộc render lại tất cả
                     this.cardsContainer.scrollTop = 0;
                     this.render(); 
                } else {
                     this.render();
                }
            }, 300);
        });
    }
    
    // --- LOGIC CUỘN NGANG ĐỒNG BỘ ---
    setupHorizontalSync() {
        const table = this.table;
        const cardsContainer = this.cardsContainer;
        const fakeScroll = this.fakeScroll;
        const fakeWrapper = this.fakeWrapper;
        
        // Set width fake scroll bằng chiều rộng thực của bảng (đã đặt min-width)
        // Cần đảm bảo table đã render để lấy scrollWidth (hoặc dùng min-width)
        fakeScroll.style.minWidth = table.style.minWidth; 

        // Khi scroll thanh giả, scroll nội dung thật
        fakeWrapper.addEventListener('scroll', () => {
            cardsContainer.scrollLeft = fakeWrapper.scrollLeft;
        });

        // Khi cuộn bảng, cập nhật fake scroll
        cardsContainer.addEventListener('scroll', () => {
            fakeWrapper.scrollLeft = cardsContainer.scrollLeft;
        });
    }


    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.8 && !this.isLoading && this.hasMore) {
            this.loadData();
        }
    }

    // --- LOGIC RENDER CHÍNH ---

    render() {
        if (this.data.length === 0 || this.rowHeight === 0) {
            this.createTemporaryElement();
            this.calculateLayout();
            this.removeTemporaryElement();
            if (this.rowHeight === 0) return;
        }

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.rowHeight);
        
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows); 
        this.startIndex = adjustedStartRow; 
        
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = adjustedStartRow + totalRowsToRender; 
        this.endIndex = Math.min(this.data.length, targetEndRow); 
        
        const totalRows = this.data.length; 
        const totalHeight = totalRows * this.rowHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        const offsetY = adjustedStartRow * this.rowHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleElements(); 
    }

    renderVisibleElements() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const viewToShow = this.isMobileView ? this.cardView : this.tableView;
        const viewToHide = this.isMobileView ? this.tableView : this.cardView;
        
        // Hiển thị/Ẩn đúng container
        viewToShow.style.display = 'block';
        viewToHide.style.display = 'none';


        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id)));

        const fragment = document.createDocumentFragment();
        
        // Xóa các phần tử cũ (cả tr và div.card)
        let nodesToRemove = [];
        Array.from(targetContainer.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (!newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node);
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => targetContainer.removeChild(node));
        
        // Thêm/Cập nhật các phần tử mới
        visibleData.forEach(item => {
            let element = targetContainer.querySelector(`[data-id="${item.id}"]`); 
            
            if (!element) {
                element = this.isMobileView ? this.createCardElement(item) : this.createRowElement(item);
                this.renderedCardIds.add(Number(item.id)); 
            }
            fragment.appendChild(element);
        });

        targetContainer.appendChild(fragment);
    }
    
    // --- HTML GENERATORS ---

    createRowElement(item) {
        const tempTBody = document.createElement('tbody'); 
        tempTBody.innerHTML = String(this.createRowHTML(item)).trim();

        if (!tempTBody.firstChild || tempTBody.firstChild.nodeName !== 'TR') {
            return document.createElement('tr'); 
        }

        const rowElement = tempTBody.firstChild;
        rowElement.setAttribute('data-id', item.id); 
        return rowElement;
    }
    
    createRowHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        const badgeIcon = isMale ? 'fa-mars' : 'fa-venus';

        return `
            <tr class="data-row" data-id="${item.id}">
                <td>${item.id || 'N/A'}</td>
                <td><img src="${item.avatar}" alt="${item.name}" class="avatar-small" loading="lazy"></td>
                <td>${item.name || 'N/A'}</td>
                <td>${item.company || 'N/A'}</td>
                <td>
                    <span class="card-badge ${badgeClass}">
                        <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                    </span>
                </td>
                <td>${item.email || 'N/A'}</td>
                <td>${item.phone || 'N/A'}</td>
                
                <td>${item.dob || 'N/A'}</td>
                <td><span style="color:${item.color || '#000'}; font-weight: 700;">${item.color || 'N/A'}</span></td>
                <td>${item.timezone || 'N/A'}</td>
                <td>${item.music || 'N/A'}</td>
                <td>${item.city || 'N/A'}</td>
                <td>${item.state || 'N/A'}</td>
                
                <td>${item.address || 'N/A'}</td>
                <td>${item.street || 'N/A'}</td>
                <td>${item.building || 'N/A'}</td>
                <td>${item.zip || item.zipcode || 'N/A'}</td>
                <td>${item.createdAt || 'N/A'}</td>
                <td>${item.password || 'N/A'}</td>
            </tr>
        `;
    }
    
    createCardElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = String(this.createCardHTML(item)).trim();

        if (!tempDiv.firstChild) {
            return document.createElement('div'); 
        }

        const cardElement = tempDiv.firstChild;
        cardElement.setAttribute('data-id', item.id); 
        return cardElement;
    }
    
    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const genderText = isMale ? 'Nam' : 'Nữ';
        
        return `
            <div class="card" data-id="${item.id}">
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                         ${genderText}
                    </span>
                </div>
                <div class="card-body">
                    <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${item.id || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${item.email || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${item.phone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${item.address || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${item.city || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> ${item.color || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${item.music || 'N/A'}</div>
                </div>
            </div>
        `;
    }
}

new ResponsiveVirtualView();