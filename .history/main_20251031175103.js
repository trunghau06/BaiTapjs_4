class VirtualCards {
    constructor() {
        this.data = [];
        this.cardsPerRow = 3;
        this.visibleRows = 0;
        this.bufferRows = 2;
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.cardHeight = 450 + 30; // card height + gap

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
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        this.loader.style.display = 'none';
    }

    async loadInitialData() {
        try {
            const res = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=1&limit=20`);
            this.data = await res.json();
            this.currentPage = 2;
        } catch (err) {
            console.error(err);
        }
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loadingMore.style.display = 'block';

        try {
            const res = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await res.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data = [...this.data, ...newData];
                this.currentPage++;
                this.calculateLayout();
                this.render();
            }
        } catch (err) {
            console.error(err);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    calculateLayout() {
        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
    }

    setupScrollListener() {
        this.cardsContainer.addEventListener('scroll', () => {
            this.render();
            this.checkLoadMore();
        });
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.calculateLayout();
            this.render();
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
        if (!this.data.length) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;

        const endRow = startRow + this.visibleRows + this.bufferRows * 2;
        this.endIndex = Math.min(this.data.length, (endRow + 1) * this.cardsPerRow);

        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        const totalHeight = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        this.renderVisibleCards();
    }

    renderVisibleCards() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const existingCards = Array.from(this.cardsGrid.children);
        const existingIds = existingCards.map(c => Number(c.dataset.id));
        const newIds = visibleData.map(d => d.id);

        // Remove old
        existingCards.forEach(card => {
            if (!newIds.includes(Number(card.dataset.id))) {
                this.cardsGrid.removeChild(card);
            }
        });

        // Add new
        visibleData.forEach(item => {
            if (!existingIds.includes(item.id)) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.createCardHTML(item);
                const cardElement = tempDiv.firstElementChild;
                this.cardsGrid.appendChild(cardElement);
            }
        });

        const adjustedStartRow = Math.floor(this.startIndex / this.cardsPerRow);
        this.cardsContent.style.paddingTop = adjustedStartRow * this.cardHeight + 'px';
    }

    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';

        return `
            <div class="card" data-id="${item.id}">
                <span class="card-id">#${item.id}</span>
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                        <i class="fa-solid ${isMale ? 'fa-mars' : 'fa-venus'}"></i>
                        ${isMale ? 'Nam' : 'Nữ'}
                    </span>
                </div>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new VirtualCards());
