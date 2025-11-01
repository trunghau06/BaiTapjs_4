class VirtualCardsRecycle {
    constructor() {
        this.data = [];
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2;
        this.cardHeight = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loadingMore = document.getElementById('loadingMore');

        this.cardPool = []; // mảng card DOM tái sử dụng

        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        this.createTemporaryCard();
        this.calculateLayout();
        this.removeTemporaryCard();
        this.createCardPool(); // tạo pool DOM
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
    }

    async loadInitialData() {
        const promises = [];
        for (let page = 1; page <= 5; page++) {
            promises.push(
                fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${page}&limit=20`).then(res => res.json())
            );
        }
        try {
            const results = await Promise.all(promises);
            this.data = results.flat().sort((a, b) => Number(a.id) - Number(b.id));
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
            const response = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await response.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data.push(...newData);
                this.data.sort((a, b) => Number(a.id) - Number(b.id));
                this.currentPage++;
                this.render();
            }
        } catch (error) {
            console.error(error);
        }

        this.isLoading = false;
        this.loadingMore.style.display = "none";
    }

    createTemporaryCard() {
        if (this.data.length > 0 && !this.cardsGrid.querySelector('.card')) {
            const sampleCard = this.createCardElement(this.data[0]);
            sampleCard.style.visibility = 'hidden';
            sampleCard.id = 'temp-card-for-measurement';
            this.cardsGrid.appendChild(sampleCard);
        }
    }

    removeTemporaryCard() {
        const temp = this.cardsGrid.querySelector('#temp-card-for-measurement');
        if (temp) this.cardsGrid.removeChild(temp);
    }

    calculateLayout() {
        const gap = 30;
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardMinWidth = 320;

        this.cardsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));

        const firstCard = this.cardsGrid.querySelector('.card');
        if (firstCard) {
            const rect = firstCard.getBoundingClientRect();
            this.cardHeight = rect.height + gap;
        } else this.cardHeight = 450;

        this.visibleRows = Math.ceil(this.cardsContainer.clientHeight / this.cardHeight) + 1;
    }

    createCardPool() {
        const totalCards = (this.visibleRows + this.bufferRows * 2) * this.cardsPerRow;
        this.cardsGrid.innerHTML = '';
        for (let i = 0; i < totalCards; i++) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.style.position = 'absolute';
            this.cardsGrid.appendChild(card);
            this.cardPool.push(card);
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
                this.createTemporaryCard();
                this.calculateLayout();
                this.removeTemporaryCard();
                this.createCardPool();
                this.render();
            }, 300);
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        if ((scrollTop + clientHeight) / scrollHeight > 0.8) this.loadData();
    }

    render() {
        if (this.data.length === 0) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;
        const totalRowsToRender = this.visibleRows + 2 * this.bufferRows;
        const targetEndRow = adjustedStartRow + totalRowsToRender;
        this.endIndex = Math.min(this.data.length, targetEndRow * this.cardsPerRow);

        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        this.cardsSpacer.style.height = totalRows * this.cardHeight + 'px';
        this.cardsContent.style.paddingTop = adjustedStartRow * this.cardHeight + 'px';

        this.renderCardPool();
    }

    renderCardPool() {
        const visibleData = this.data.slice(this.startIndex, this.endIndex);

        visibleData.forEach((item, i) => {
            const card = this.cardPool[i];
            card.style.top = Math.floor((this.startIndex + i) / this.cardsPerRow) * this.cardHeight + 'px';
            card.style.left = ((this.startIndex + i) % this.cardsPerRow) * (this.cardsGrid.offsetWidth / this.cardsPerRow) + 'px';
            card.innerHTML = this.createCardHTML(item);
        });
    }

    createCardElement(item) {
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = this.createCardHTML(item);
        return div;
    }

    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#000';
        return `
            <div class="card-header">
                <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${item.name || 'N/A'}</div>
                    <div class="card-company">${item.company || 'N/A'}</div>
                </div>
                <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                    <i class="fa-solid ${isMale ? 'fa-mars' : 'fa-venus'}"></i>
                    ${isMale ? 'Nam' : 'Nu'}
                </span>
            </div>
            <div class="card-body">
                <div class="card-item"><strong>ID:</strong> ${item.id || 'N/A'}</div>
                <div class="card-item"><strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                <div class="card-item"><strong>Company:</strong> ${item.company || 'N/A'}</div>
                <div class="card-item"><strong>Color:</strong> <span style="color:${colorValue}">${colorValue}</span></div>
            </div>
        `;
    }
}

new VirtualCardsRecycle();
