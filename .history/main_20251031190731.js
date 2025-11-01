class VirtualCardsGrid {
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

        this.cardsContainer = document.querySelector('.cards-container');
        this.cardsSpacer = document.querySelector('.cards-spacer');
        this.cardsContent = document.querySelector('.cards-content');
        this.cardsGrid = document.querySelector('.cards-grid');
        this.loadingMore = document.querySelector('.loading-more');

        this.cardPool = []; // Pool card tái sử dụng

        this.init();
    }

    async init() {
        await this.loadInitialData();
        this.cardsContainer.style.display = 'block';
        this.createTemporaryCard();
        this.calculateLayout();
        this.removeTemporaryCard();
        this.createCardPool();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
    }

    async loadInitialData() {
        try {
            const responses = await Promise.all(
                Array.from({ length: 5 }, (_, i) =>
                    fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${i+1}&limit=20`).then(r => r.json())
                )
            );
            this.data = responses.flat().sort((a, b) => Number(a.id) - Number(b.id));
            this.currentPage = 6;
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
                this.data.push(...newData);
                this.data.sort((a,b)=>Number(a.id)-Number(b.id));
                this.currentPage++;
                this.render();
            }
        } catch (err) { console.error(err); }
        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    createTemporaryCard() {
        if (this.data.length && !this.cardsGrid.querySelector('.card')) {
            const temp = this.createCardElement(this.data[0]);
            temp.style.visibility = 'hidden';
            temp.id = 'temp-card';
            this.cardsGrid.appendChild(temp);
        }
    }

    removeTemporaryCard() {
        const temp = document.getElementById('temp-card');
        if(temp) temp.remove();
    }

    calculateLayout() {
        const firstCard = this.cardsGrid.querySelector('.card');
        if(firstCard){
            const rect = firstCard.getBoundingClientRect();
            this.cardHeight = rect.height + 30; // gap
        } else this.cardHeight = 450;

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;

        const containerWidth = this.cardsGrid.offsetWidth;
        const cardMinWidth = 320;
        this.cardsPerRow = Math.floor(containerWidth / cardMinWidth) || 1;
    }

    createCardPool() {
        const totalCards = (this.visibleRows + 2 * this.bufferRows) * this.cardsPerRow;
        this.cardsGrid.innerHTML = '';
        for(let i=0;i<totalCards;i++){
            const card = document.createElement('div');
            card.className = 'card';
            this.cardsGrid.appendChild(card);
            this.cardPool.push(card);
        }
    }

    setupScrollListener() {
        this.cardsContainer.addEventListener('scroll', () => {
            this.render();
            this.checkLoadMore();
        });
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.createTemporaryCard();
            this.calculateLayout();
            this.removeTemporaryCard();
            this.createCardPool();
            this.render();
        });
    }

    checkLoadMore() {
        const scrollTop = this.cardsContainer.scrollTop;
        const scrollHeight = this.cardsContainer.scrollHeight;
        const clientHeight = this.cardsContainer.clientHeight;
        if((scrollTop + clientHeight)/scrollHeight > 0.8){
            this.loadData();
        }
    }

    render() {
        if(!this.data.length) return;

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
        for(let i=0;i<this.cardPool.length;i++){
            const card = this.cardPool[i];
            if(visibleData[i]){
                card.innerHTML = this.createCardHTML(visibleData[i]);
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    }

    createCardElement(item){
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = this.createCardHTML(item);
        return div;
    }

    createCardHTML(item){
        const isMale = item.genre?.toLowerCase() === 'male';
        const color = item.color || '#000';
        return `
            <div class="card-header">
                <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                <div class="card-info">
                    <div class="card-name">${item.name || 'N/A'}</div>
                    <div class="card-company">${item.company || 'N/A'}</div>
                </div>
                <span class="card-badge ${isMale?'badge-male':'badge-female'}">
                    <i class="fa-solid ${isMale?'fa-mars':'fa-venus'}"></i>
                    ${isMale?'Nam':'Nu'}
                </span>
            </div>
            <div class="card-body">
                <div class="card-item"><strong>ID:</strong> ${item.id||'N/A'}</div>
                <div class="card-item"><strong>Genre:</strong> ${item.genre||'N/A'}</div>
                <div class="card-item"><strong>Company:</strong> ${item.company||'N/A'}</div>
                <div class="card-item"><strong>Color:</strong> <span class="color-text" style="color:${color}">${color}</span></div>
            </div>
        `;
    }
}

new VirtualCardsGrid();
