class VirtualTable {
    constructor() {
        this.data = [];
        this.cardsPerRow = 1; // Luôn là 1 hàng cho bảng
        this.visibleRows = 0;
        this.bufferRows = 5; // Tăng buffer cho bảng để chuyển động mượt hơn
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.rowHeight = 0; // Đổi từ cardHeight -> rowHeight
        
        this.renderedCardIds = new Set(); 

        this.cardsContainer = document.getElementById('cardsContainer'); // Giữ nguyên ID DOM
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.tableBody = document.getElementById('tableBody'); // Đổi từ cardsGrid -> tableBody
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        
        // 1. Đo đạc kích thước hàng (row) chính xác
        this.createTemporaryRow(); // Đổi từ createTemporaryCard
        this.calculateLayout(); 
        this.removeTemporaryRow(); // Đổi từ removeTemporaryCard

        this.setupScrollListener();
        this.setupResizeListener();
        this.render(); // Bắt đầu render ảo
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        // Giữ nguyên logic load data
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
            console.log(`✅ Loaded ${this.data.length} records initially`);
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
    
    // Tạo hàng mẫu tạm thời để đo đạc kích thước chính xác
    createTemporaryRow() {
        // Đảm bảo data đã load và chưa có hàng nào được render
        if (this.data.length > 0 && !this.tableBody.querySelector('.data-row')) {
            const sampleRow = this.createRowElement(this.data[0]);
            sampleRow.style.visibility = 'hidden'; 
            sampleRow.id = 'temp-row-for-measurement';
            this.tableBody.appendChild(sampleRow);
        }
    }

    // Xóa hàng tạm thời
    removeTemporaryRow() {
        const tempRow = this.tableBody.querySelector('#temp-row-for-measurement');
        if (tempRow) {
            this.tableBody.removeChild(tempCard);
        }
    }

    calculateLayout() {
        this.cardsPerRow = 1; // Luôn là 1 hàng cho bảng
        
        const firstRow = this.tableBody.querySelector('.data-row'); // Tìm hàng
        if (firstRow) {
            const rect = firstRow.getBoundingClientRect();
            // Lấy chiều cao của hàng, không cần cộng gap vì bảng không có gap giữa các hàng
            this.rowHeight = rect.height; 
        } else {
            this.rowHeight = 80; // Giá trị mặc định an toàn
        }

        if (this.rowHeight > 0) {
            const containerHeight = this.cardsContainer.clientHeight;
            // Tính số lượng hàng hiển thị
            this.visibleRows = Math.ceil(containerHeight / this.rowHeight) + 1; 
        } else {
            this.visibleRows = 10; // Mặc định
            this.rowHeight = 80;
        }
        console.log(`📐 Layout: rowHeight=${this.rowHeight}, visibleRows=${this.visibleRows}`);
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
                this.createTemporaryRow(); // Dùng hàng tạm thời
                this.calculateLayout();
                this.removeTemporaryRow(); // Xóa hàng tạm thời
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

    render() {
        // Kiểm tra lại bố cục nếu chưa tính được
        if (this.data.length === 0 || this.rowHeight === 0) {
            this.createTemporaryRow();
            this.calculateLayout();
            this.removeTemporaryRow();
            if (this.rowHeight === 0) return;
        }

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.rowHeight);
        
        // Tính startIndex và offset có buffer (trừ)
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows); 
        this.startIndex = adjustedStartRow; // Bảng: startIndex = adjustedStartRow * 1
        
        // Tính endIndex (visible + 2*buffer)
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = adjustedStartRow + totalRowsToRender; 
        this.endIndex = Math.min(this.data.length, targetEndRow); // Bảng: endIndex = targetEndRow * 1
        
        // Tính tổng height cho spacer
        const totalRows = this.data.length; // Tổng số hàng bằng tổng số data
        const totalHeight = totalRows * this.rowHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        // Set padding-top để tạo offset
        const offsetY = adjustedStartRow * this.rowHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleRows(); // Đổi từ renderVisibleCards
    }

    /**
     * DOM Reconciliation (chỉ thêm/xóa/sắp xếp lại)
     */
    renderVisibleRows() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id)));

        const fragment = document.createDocumentFragment();
        
        // 1. XÓA CÁC HÀNG CŨ (tr)
        let nodesToRemove = [];
        Array.from(this.tableBody.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (!newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node);
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => this.tableBody.removeChild(node));
        
        // 2. THÊM/SẮP XẾP LẠI HÀNG (tr)
        visibleData.forEach(item => {
            const itemId = Number(item.id);
            let rowElement = this.tableBody.querySelector(`[data-id="${item.id}"]`); // Tìm theo data-id
            
            if (!rowElement) {
                rowElement = this.createRowElement(item); // Tạo hàng mới
                this.renderedCardIds.add(itemId); 
            }
            fragment.appendChild(rowElement);
        });

        this.tableBody.appendChild(fragment);

        console.log(`🎨 Rendered ${this.tableBody.children.length} rows (index ${this.startIndex}-${this.endIndex})`);
    }

    createRowElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.createRowHTML(item).trim();
        // Gán data-id vào thẻ tr
        tempDiv.firstChild.setAttribute('data-id', item.id); 
        return tempDiv.firstChild;
    }
    
    // Tạo HTML cho hàng bảng (<tr>...</tr>)
    createRowHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        const badgeIcon = isMale ? 'fa-mars' : 'fa-venus';

        return `
            <tr class="data-row" data-id="${item.id}">
                <td>${item.id || 'N/A'}</td>
                <td><img src="${item.avatar}" alt="${item.name}" class="avatar-small" loading="lazy"></td>
                <td class="name-column">
                    <div class="card-name">${item.name || 'N/A'}</div>
                    <div class="card-company">${item.company || 'N/A'}</div>
                </td>
                <td>
                    <span class="card-badge ${badgeClass}">
                        <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                    </span>
                </td>
                <td>${item.dob || 'N/A'}</td>
                <td>${item.timezone || 'N/A'}</td>
                <td><span style="color:${item.color || '#000'}; font-weight: 700;">${item.color || 'N/A'}</span></td>
                <td class="email-column">${item.email || 'N/A'}</td>
                <td>${item.phone || 'N/A'}</td>
                <td>${item.city || 'N/A'}</td>
                <td>${item.state || 'N/A'}</td>
                <td>${item.zip || item.zipcode || 'N/A'}</td>
            </tr>
        `;
    }
}

new VirtualTable();