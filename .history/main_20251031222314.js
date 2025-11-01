class VirtualTable {
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
        this.tableBody = document.getElementById('tableBody'); 
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        
        window.requestAnimationFrame(() => { 
            this.createTemporaryRow(); 
            this.calculateLayout(); 
            this.removeTemporaryRow(); 

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
    
    createTemporaryRow() {
        if (this.data.length > 0 && !this.tableBody.querySelector('.data-row')) {
            const sampleRow = this.createRowElement(this.data[0]);
            sampleRow.style.visibility = 'hidden'; 
            sampleRow.id = 'temp-row-for-measurement';
            this.tableBody.appendChild(sampleRow);
        }
    }

    removeTemporaryRow() {
        const tempRow = this.tableBody.querySelector('#temp-row-for-measurement');
        if (tempRow) {
            this.tableBody.removeChild(tempRow);
        }
    }

    calculateLayout() {
        this.cardsPerRow = 1; 
        
        const firstRow = this.tableBody.querySelector('.data-row'); 
        if (firstRow) {
            const rect = firstRow.getBoundingClientRect();
            this.rowHeight = rect.height; 
        } else {
            this.rowHeight = 80; 
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
                this.createTemporaryRow();
                this.calculateLayout();
                this.removeTemporaryRow(); 
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
        if (this.data.length === 0 || this.rowHeight === 0) {
            this.createTemporaryRow();
            this.calculateLayout();
            this.removeTemporaryRow();
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

        this.renderVisibleRows(); 
    }

    renderVisibleRows() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id)));

        const fragment = document.createDocumentFragment();
        
        let nodesToRemove = [];
        Array.from(this.tableBody.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (!newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node);
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => this.tableBody.removeChild(node));
        
        visibleData.forEach(item => {
            let rowElement = this.tableBody.querySelector(`[data-id="${item.id}"]`); 
            
            if (!rowElement) {
                rowElement = this.createRowElement(item); 
                this.renderedCardIds.add(Number(item.id)); 
            }
            fragment.appendChild(rowElement);
        });

        this.tableBody.appendChild(fragment);
    }

    createRowElement(item) {
        // SỬA LỖI: Dùng <tbody> tạm thời thay vì <div> để tạo thẻ <tr> hợp lệ
        const tempTBody = document.createElement('tbody'); 
        tempTBody.innerHTML = String(this.createRowHTML(item)).trim();

        // Kiểm tra phần tử con đầu tiên (phải là <tr>)
        if (!tempTBody.firstChild || tempTBody.firstChild.nodeName !== 'TR') {
            // Fallback nếu việc tạo <tr> thất bại
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
}

new VirtualTable();

const cardsContainer = document.getElementById('cardsContainer');
const fakeScrollWrapper = document.querySelector('.fake-scroll-wrapper');
const fakeScroll = document.querySelector('.fake-scroll');

// Cập nhật width thanh giả = scrollWidth của bảng
function updateFakeScroll() {
    fakeScroll.style.width = cardsContainer.scrollWidth + 'px';
}
window.addEventListener('resize', updateFakeScroll);
updateFakeScroll();

// Đồng bộ scroll: kéo thanh giả = kéo bảng và ngược lại
fakeScrollWrapper.addEventListener('scroll', () => {
    cardsContainer.scrollLeft = fakeScrollWrapper.scrollLeft;
});
cardsContainer.addEventListener('scroll', () => {
    fakeScrollWrapper.scrollLeft = cardsContainer.scrollLeft;
});
