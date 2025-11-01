class ResponsiveVirtualView {
    constructor() {
        this.data = [];
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
        
        // CÁC CONTAINER DOM
        this.tableBody = document.getElementById('tableBody'); 
        this.tableView = document.getElementById('tableView'); 
        this.cardView = document.getElementById('cardView'); 
        
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');
        
        this.init();
    }
    
    // Thuộc tính tính toán chế độ xem (breakpoint 768px)
    get isMobileView() {
        return window.innerWidth <= 768; 
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        
        window.requestAnimationFrame(() => { 
            this.updateViewMode();
            
            // Đo đạc layout lần đầu (Row/Card Height)
            this.createTemporaryElement(); 
            this.calculateLayout(); 
            this.removeTemporaryElement(); 

            this.setupScrollListener(); 
            this.setupResizeListener(); 
            this.render(); 
            this.loader.style.display = 'none';
        });
    }

    async loadInitialData() {
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

    async loadData() {
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
    
    // --- LOGIC RESPONSIVE & ĐO ĐẠC ---

    updateViewMode() {
        // Luôn gọi lại updateViewMode khi có sự kiện (resize, init)
    }
    
    createTemporaryElement() {
        // Chọn container và class tùy thuộc vào chế độ xem hiện tại
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
        const gap = this.isMobileView ? 15 : 0; 

        this.cardsPerRow = 1; 
        
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
                // Khi resize, gọi updateViewMode để kiểm tra breakpoint
                this.updateViewMode();
                this.createTemporaryElement();
                this.calculateLayout();
                this.removeTemporaryElement(); 
                this.render();
            }, 300);
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

    // --- LOGIC RENDER ĐA NĂNG ---

    render() {
        this.updateViewMode(); 
        
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
        
        // Xóa các phần tử cũ
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

    // --- HTML GENERATORS: ROW (TABLE) ---

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
    
    // --- HTML GENERATORS: CARD (MOBILE) ---
    
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
        const colorValue = item.color || '#000';

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
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> <span style="color:${colorValue};">${colorValue}</span></div>
                    <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${item.music || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${item.address || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${item.city || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map card-icon"></i> <strong>State:</strong> ${item.state || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-road card-icon"></i> <strong>Street:</strong> ${item.street || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building-columns card-icon"></i> <strong>Building:</strong> ${item.building || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-hashtag card-icon"></i> <strong>ZIP:</strong> ${item.zip || item.zipcode || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${item.email || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${item.phone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-lock card-icon"></i> <strong>Password:</strong> ${item.password || 'N/A'}</div>
                </div>
            </div>
        `;
    }
}

setupHorizontalSync() {
    // Cần đảm bảo table đã render để lấy minWidth
    this.fakeScroll.style.minWidth = this.tableView.scrollWidth + 'px';

    // Khi scroll thanh giả, cuộn cardsContainer (table view)
    this.fakeWrapper.addEventListener('scroll', () => {
        this.cardsContainer.scrollLeft = this.fakeWrapper.scrollLeft;
    });

    // Khi cuộn table (cardsContainer), cập nhật fake scroll
    this.cardsContainer.addEventListener('scroll', () => {
        if (!this.isMobileView) { // Chỉ áp dụng cho table view
            this.fakeWrapper.scrollLeft = this.cardsContainer.scrollLeft;
        }
    });
}

new ResponsiveVirtualView();