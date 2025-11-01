class VirtualTable {
    constructor() {
        this.data = [];
        this.rowHeight = 50; // ước lượng chiều cao 1 hàng
        this.visibleRows = 0;
        this.bufferRows = 5;
        this.startIndex = 0;
        this.endIndex = 0;
        this.currentPage = 1;
        this.hasMore = true;
        this.isLoading = false;

        this.tableContainer = document.getElementById('tableContainer');
        this.tableBody = document.getElementById('tableBody');
        this.loader = document.getElementById('loader');
        this.loadingMore = document.getElementById('loadingMore');

        this.init();
    }

    async init() {
        await this.loadData();
        this.tableContainer.style.display = 'block';
        this.loader.style.display = 'none';

        this.calculateVisibleRows();
        this.render();

        this.tableContainer.addEventListener('scroll', () => {
            this.onScroll();
        });

        window.addEventListener('resize', () => {
            this.calculateVisibleRows();
            this.render();
        });
    }

    calculateVisibleRows() {
        const containerHeight = this.tableContainer.clientHeight;
        this.visibleRows = Math.ceil(containerHeight / this.rowHeight) + this.bufferRows;
    }

    async loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.loadingMore.style.display = 'block';

        try {
            const res = await fetch(`https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20`);
            const newData = await res.json();
            if (newData.length === 0) this.hasMore = false;
            else this.data.push(...newData);

            this.currentPage++;
        } catch (err) {
            console.error(err);
        }

        this.isLoading = false;
        this.loadingMore.style.display = 'none';
    }

    async onScroll() {
        const scrollTop = this.tableContainer.scrollTop;
        this.startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.bufferRows);
        this.endIndex = Math.min(this.data.length, this.startIndex + this.visibleRows);

        this.render();

        // Nếu scroll gần cuối → load thêm
        if (scrollTop + this.tableContainer.clientHeight >= this.tableContainer.scrollHeight - 100) {
            await this.loadData();
            this.render();
        }
    }

    render() {
        this.tableBody.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (let i = this.startIndex; i < this.endIndex; i++) {
            const row = this.createRow(this.data[i]);
            fragment.appendChild(row);
        }

        this.tableBody.appendChild(fragment);
        // Spacer tạo tổng chiều cao
        this.tableBody.style.paddingTop = `${this.startIndex * this.rowHeight}px`;
    }

    createRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id || ''}</td>
            <td>${item.name || ''}</td>
            <td>${item.genre || ''}</td>
            <td>${item.company || ''}</td>
            <td>${item.dob || ''}</td>
            <td>${item.timezone || ''}</td>
            <td style="color:${item.color || '#000'}">${item.color || ''}</td>
            <td>${item.music || ''}</td>
            <td>${item.address || ''}</td>
            <td>${item.city || ''}</td>
            <td>${item.state || ''}</td>
            <td>${item.street || ''}</td>
            <td>${item.building || ''}</td>
            <td>${item.zip || item.zipcode || ''}</td>
            <td>${item.email || ''}</td>
            <td>${item.phone || ''}</td>
            <td>${item.password || ''}</td>
            <td>${item.createdAt || ''}</td>
            <td><img src="${item.avatar}" width="40" height="40" style="border-radius:50%;"/></td>
        `;
        return tr;
    }
}

new VirtualTable();
