class VirtualCards {
    constructor() {
        this.data = [];
        this.cardHeight = 180; // fallback chiều cao
        this.bufferRows = 2;
        this.cardsPerRow = 1;
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        await this.loadData();
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        if (this.currentPage > 1) this.loadingMore.style.display = "block";

        try {
            const response = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await response.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data = [...this.data, ...newData];
                this.currentPage++;
            }
        } catch(e) { console.error(e); }

        this.isLoading = false;
        this.loadingMore.style.display = "none";
    }

    calculateLayout() {
        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + this.bufferRows * 2;
    }

    setupScrollListener() {
        this.cardsContainer.addEventListener('scroll', () => {
            this.render();
            this.checkLoadMore();
        });
    }

    setupResizeListener() {
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.calculateLayout();
                this.render();
            }, 200);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        if ((scrollTop + clientHeight) / scrollHeight > 0.7 && !this.isLoading && this.hasMore) {
            this.loadData().then(() => this.render());
        }
    }

    render() {
        if (this.data.length === 0) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const startIndex = startRow * this.cardsPerRow;
        const endIndex = Math.min(this.data.length, startIndex + this.visibleRows * this.cardsPerRow);

        // update spacer height
        this.cardsSpacer.style.height = (this.data.length * this.cardHeight) + 'px';

        // remove card không cần thiết
        Array.from(this.cardsGrid.children).forEach(card => {
            const idx = parseInt(card.dataset.index);
            if (idx < startIndex || idx >= endIndex) this.cardsGrid.removeChild(card);
        });

        // add card mới
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.cardsGrid.querySelector(`.card[data-index="${i}"]`)) {
                const cardHTML = this.createCard(this.data[i]);
                const temp = document.createElement('div');
                temp.innerHTML = cardHTML;
                const cardEl = temp.firstElementChild;
                cardEl.style.position = 'absolute';
                cardEl.style.top = `${i * this.cardHeight}px`;
                cardEl.dataset.index = i;
                this.cardsGrid.appendChild(cardEl);
            }
        }
    }

    createCard(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';
        return `
            <div class="card">
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
                <div class="card-body">
                    <div class="card-item"><strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><strong>Color:</strong> <span style="color:${colorValue}; font-weight:bold;">${colorValue}</span></div>
                </div>
            </div>
        `;
    }
}

new VirtualCards();
