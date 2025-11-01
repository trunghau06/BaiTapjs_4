class VirtualScrollView {
    constructor() {
        this.data = [];
        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer = document.getElementById('cardsSpacer');
        this.cardsContent = document.getElementById('cardsContent');
        this.tableBody = document.getElementById('tableBody');
        this.tableView = document.getElementById('tableView');
        this.cardView = document.getElementById('cardView');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');
        this.fakeScroll = document.getElementById('fakeScroll');
        this.fakeWrapper = document.querySelector('.fake-scroll-wrapper');

        this.cardsPerRow = 1;
        this.visibleRows = 0;
        this.bufferRows = 5;
        this.rowHeight = 80; 
        this.startIndex = 0;
        this.endIndex = 0;

        this.renderedIds = new Set();
        this.currentPage = 1;
        this.hasMore = true;
        this.isLoading = false;

        this.init();
    }

    async init() {
        await this.loadData(true);
        this.calculateLayout();
        this.setupScroll();
        this.setupResize();
        this.setupFakeScroll();
        this.loader.style.display = 'none';
        this.render();
    }

    async loadData(initial=false) {
        if (this.isLoading || (!this.hasMore && !initial)) return;
        this.isLoading = true;
        if(!initial) this.loadingMore.style.display = 'block';

        try {
            const res = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await res.json();
            if (newData.length === 0) this.hasMore = false;
            else {
                this.data = [...this.data, ...newData];
                this.currentPage++;
            }
        } catch(e) {
            console.error(e);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    calculateLayout() {
        const containerHeight = this.cardsContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.rowHeight) + this.bufferRows*2;
    }

    setupScroll() {
        this.cardsContainer.addEventListener('scroll', async () => {
            this.render();
            // Load thêm nếu gần cuối
            if ((this.cardsContainer.scrollTop + this.cardsContainer.clientHeight) / this.cardsContainer.scrollHeight > 0.8) {
                await this.loadData();
            }
        });
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.calculateLayout();
            this.render();
        });
    }

    setupFakeScroll() {
        if(!this.fakeScroll) return;
        this.fakeScroll.style.minWidth = this.tableView.scrollWidth + 'px';
        this.fakeWrapper.addEventListener('scroll', ()=> {
            this.cardsContainer.scrollLeft = this.fakeWrapper.scrollLeft;
        });
        this.cardsContainer.addEventListener('scroll', ()=> {
            if(window.innerWidth>768) this.fakeWrapper.scrollLeft = this.cardsContainer.scrollLeft;
        });
    }

    render() {
        const scrollTop = this.cardsContainer.scrollTop;
        const startRow = Math.floor(scrollTop / this.rowHeight);
        const adjustedStart = Math.max(0, startRow - this.bufferRows);
        this.startIndex = adjustedStart;
        this.endIndex = Math.min(this.data.length, adjustedStart + this.visibleRows);

        // Spacer
        this.cardsSpacer.style.height = this.data.length * this.rowHeight + 'px';
        this.cardsContent.style.paddingTop = adjustedStart * this.rowHeight + 'px';

        // Render table or cards
        if(window.innerWidth>768) this.renderTable();
        else this.renderCards();
    }

    renderTable() {
        this.tableView.style.display='block';
        this.cardView.style.display='none';

        const fragment = document.createDocumentFragment();
        const visible = this.data.slice(this.startIndex, this.endIndex);
        const removeNodes = [];

        Array.from(this.tableBody.children).forEach(node => {
            if(!visible.find(v=>v.id==node.dataset.id)) removeNodes.push(node);
        });
        removeNodes.forEach(n=>{this.renderedIds.delete(n.dataset.id); this.tableBody.removeChild(n);});

        visible.forEach(item=>{
            if(!this.renderedIds.has(String(item.id))){
                const tr = document.createElement('tr');
                tr.dataset.id = item.id;
                tr.innerHTML = `
                <td>${item.id}</td>
                <td><img src="${item.avatar}" class="avatar-small"></td>
                <td>${item.name}</td>
                <td>${item.company}</td>
                <td>${item.genre}</td>
                <td>${item.email}</td>
                <td>${item.phone}</td>
                <td>${item.dob}</td>
                <td>${item.color}</td>
                <td>${item.timezone}</td>
                <td>${item.music}</td>
                <td>${item.city}</td>
                <td>${item.state}</td>
                <td>${item.address}</td>
                <td>${item.street}</td>
                <td>${item.building}</td>
                <td>${item.zip}</td>
                <td>${item.createdAt}</td>
                <td>${item.password}</td>
                `;
                fragment.appendChild(tr);
                this.renderedIds.add(String(item.id));
            }
        });

        this.tableBody.appendChild(fragment);
    }

    renderCards() {
        this.tableView.style.display='none';
        this.cardView.style.display='flex';

        const fragment = document.createDocumentFragment();
        const visible = this.data.slice(this.startIndex, this.endIndex);
        const removeNodes = [];

        Array.from(this.cardView.children).forEach(node => {
            if(!visible.find(v=>v.id==node.dataset.id)) removeNodes.push(node);
        });
        removeNodes.forEach(n=>{this.renderedIds.delete(n.dataset.id); this.cardView.removeChild(n);});

        visible.forEach(item=>{
            if(!this.renderedIds.has(String(item.id))){
                const div = document.createElement('div');
                div.dataset.id = item.id;
                div.className = 'card';
                div.innerHTML = `
                <div class="card-header">
                    <img src="${item.avatar}" class="avatar">
                    <div class="card-info">
                        <div class="card-name">${item.name}</div>
                        <div class="card-company">${item.company}</div>
                    </div>
                    <span class="card-badge">${item.genre}</span>
                </div>
                <div class="card-body">
                    <div class="card-item"><strong>ID:</strong> ${item.id}</div>
                    <div class="card-item"><strong>Email:</strong> ${item.email}</div>
                    <div class="card-item"><strong>Phone:</strong> ${item.phone}</div>
                    <div class="card-item"><strong>DOB:</strong> ${item.dob}</div>
                    <div class="card-item"><strong>Color:</strong> ${item.color}</div>
                </div>
                `;
                fragment.appendChild(div);
                this.renderedIds.add(String(item.id));
            }
        });

        this.cardView.appendChild(fragment);
    }
}

new VirtualScrollView();
