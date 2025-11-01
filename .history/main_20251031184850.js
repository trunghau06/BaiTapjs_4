class VirtualCards {
    constructor() {
        this.data = []; // lưu tất cả dữ liệu
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2; // số hàng buffer
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.cardHeight = 0;

        this.renderedCardIds = new Set(); // id card đang render

        // DOM elements
        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        this.calculateLayout();
        this.render(); 
        this.setupScrollListener();
        this.setupResizeListener();
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        const promises = [];
        for (let page = 1; page <= 5; page++) {
            promises.push(fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`).then(res => res.json()));
        }
        try {
            const results = await Promise.all(promises);
            this.data = results.flat();
            this.data.sort((a, b) => a.id - b.id);
            this.currentPage = 6;
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loadingMore.style.display = 'block';
        try {
            const response = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await response.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data = [...this.data, ...newData];
                this.data.sort((a, b) => a.id - b.id);
                this.currentPage++;
                this.render();
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        }
        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 30;
        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));

        if (!this.cardsGrid.querySelector('.card') && this.data.length > 0) {
            const sampleCard = this.createCardElement(this.data[0]);
            this.cardsGrid.appendChild(sampleCard);
        }
        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            this.cardHeight = rect.height + gap;
            if (this.renderedCardIds.size === 0) this.cardsGrid.removeChild(firstCard);
        } else {
            this.cardHeight = 450;
        }

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
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
                this.calculateLayout();
                this.render();
            }, 300);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        if (scrollPercentage > 0.8 && !this.isLoading && this.hasMore) this.loadData();
    }

    render() {
        if (this.data.length === 0 || this.cardHeight === 0) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;

        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows;
        const targetEndRow = startRow + totalRowsToRender;
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow);

        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        const offsetY = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => item.id));

        // xoa card khong nam trong viewport
        Array.from(this.cardsGrid.children).forEach(node => {
            const nodeId = Number(node.dataset.id);
            if (!newVisibleIds.has(nodeId)) {
                this.cardsGrid.removeChild(node);
                this.renderedCardIds.delete(nodeId);
            }
        });

        // them card chua co va dat vi tri absolute
        visibleData.forEach((item, i) => {
            let card = this.cardsGrid.querySelector(`[data-id="${item.id}"]`);
            if (!card) {
                card = this.createCardElement(item);
                this.cardsGrid.appendChild(card);
                this.renderedCardIds.add(item.id);
            }
            const index = this.startIndex + i;
            const row = Math.floor(index / this.cardsPerRow);
            const col = index % this.cardsPerRow;
            card.style.position = 'absolute';
            card.style.top = row * this.cardHeight + 'px';
            card.style.left = col * (320 + 30) + 'px';
        });
    }

    createCardElement(item) {
        const div = document.createElement('div');
        div.className = 'card';
        div.dataset.id = item.id;

        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';

        div.innerHTML = `
            <div class="card-header">
                <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${item.name || 'N/A'}</div>
                    <div class="card-company">${item.company || 'N/A'}</div>
                </div>
                <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                    <i class="fa-solid ${isMale ? 'fa-mars' : 'fa-venus'}"></i> ${isMale ? 'Nam' : 'Nu'}
                </span>
            </div>
            <div class="card-body">
                <div class="card-item"><strong>ID:</strong> ${item.id}</div>
                <div class="card-item"><strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                <div class="card-item"><strong>Name:</strong> ${item.name || 'N/A'}</div>
                <div class="card-item"><strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                <div class="card-item"><strong>Company:</strong> ${item.company || 'N/A'}</div>
                <div class="card-item"><strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                <div class="card-item"><strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                <div class="card-item"><strong>Color:</strong> <span style="color:${colorValue}; font-weight:bold;">${colorValue}</span></div>
                <div class="card-item"><strong>Music:</strong> ${item.music || 'N/A'}</div>
                <div class="card-item"><strong>Address:</strong> ${item.address || 'N/A'}</div>
                <div class="card-item"><strong>City:</strong> ${item.city || 'N/A'}</div>
                <div class="card-item"><strong>State:</strong> ${item.state || 'N/A'}</div>
                <div class="card-item"><strong>Street:</strong> ${item.street || 'N/A'}</div>
                <div class="card-item"><strong>Building:</strong> ${item.building || 'N/A'}</div>
                <div class="card-item"><strong>ZIP:</strong> ${item.zip || item.zipcode || 'N/A'}</div>
                <div class="card-item"><strong>Email:</strong> ${item.email || 'N/A'}</div>
                <div class="card-item"><strong>Phone:</strong> ${item.phone || 'N/A'}</div>
                <div class="card-item"><strong>Password:</strong> ${item.password || 'N/A'}</div>
            </div>
        `;
        return div;
    }
}

new VirtualCards();
