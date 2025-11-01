class VirtualCards {
    constructor() {
        this.data = [];
        this.cardsPerRow = 0;
        this.visibleRows = 0;
        this.bufferRows = 2;
        this.startIndex = 0;
        this.endIndex = 0;
        this.isLoading = false;
        this.hasMore = true;
        this.currentPage = 1;
        this.cardHeight = 0;

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        this.cardsContainer.style.display = 'block';
        this.calculateLayout();
        await this.loadData(); // Load page 1
        this.setupScrollListener();
        this.render();
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        this.loadingMore.style.display = "block";

        try {
            const res = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await res.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data = [...this.data, ...newData];
                this.currentPage++;
            }
        } catch (err) {
            console.error(err);
        }

        this.isLoading = false;
        this.loadingMore.style.display = "none";
    }

    calculateLayout() {
        const containerWidth = this.cardsGrid.offsetWidth;
        const cardWidth = 320;
        const gap = 20;

        this.cardsPerRow = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1;

        // fallback height
        this.cardHeight = 400;

        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.cardHeight) + 1;
    }

    setupScrollListener() {
        this.cardsContainer.addEventListener('scroll', async () => {
            this.render();
            const scrollTop = this.cardsContainer.scrollTop;
            const scrollHeight = this.cardsContainer.scrollHeight;
            const clientHeight = this.cardsContainer.clientHeight;

            if ((scrollTop + clientHeight) / scrollHeight > 0.8) {
                await this.loadData();
                this.render();
            }
        });
    }

    render() {
        if (!this.data.length) return;

        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.cardHeight);
        const adjustedStartRow = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStartRow * this.cardsPerRow;

        const endRow = startRow + this.visibleRows + this.bufferRows * 2;
        this.endIndex = Math.min(this.data.length, (endRow) * this.cardsPerRow);

        // spacer total height
        const totalRows = Math.ceil(this.data.length / this.cardsPerRow);
        this.cardsSpacer.style.height = totalRows * this.cardHeight + 'px';

        // offset padding
        this.cardsContent.style.paddingTop = adjustedStartRow * this.cardHeight + 'px';

        // Render only visible cards
        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        this.cardsGrid.innerHTML = visibleData.map(item => this.createCardHTML(item)).join('');
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
                        <i class="fa-solid ${isMale ? 'fa-mars' : 'fa-venus'}"></i> ${isMale ? 'Nam' : 'Nữ'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="card-item"><strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><strong>Color:</strong> <span style="color:${colorValue}">${colorValue}</span></div>
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
            </div>
        `;
    }
}

new VirtualCards();
