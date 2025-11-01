class VirtualCards 
{
    constructor() 
    {
        this.data        = [];  //* chua du lieu card tu API
        this.cardHeight  = 250; //* chieu cao moi card
        this.cardsPerRow = 0;   //* so luong card tren moi hang
        this.visibleRows = 0    //* so hang thuc te tren man viewport
        this.bufferRows  = 1   //* so hang tai them
        this.startIndex  = 0;
        this.endIndex    = 0;
        this.isLoading   = false;
        this.hasMore     = true;
        this.currentPage = 1;

        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsSpacer    = document.getElementById('cardsSpacer');
        this.cardsContent   = document.getElementById('cardsContent');
        this.cardsGrid      = document.getElementById('cardsGrid');
        this.loader         = document.getElementById('loader');
        this.loadingMore    = document.getElementById('loadingMore');

        this.init();
    }

    async init() 
    {
        await this.loadData();

        this.cardsContainer.style.display = 'block'; 
        this.calculateLayout();
        this.setupScrollListener();
        this.setupResizeListener();
        this.render();
        this.loader.style.display = 'none';
    }

    async loadData()
    {
        //* Neu dang tai hoac het du lieu -> thoat
        if (this.isLoading || !this.hasMore)
            return;

        //* Danh dau -> tranh trung
        this.isLoading = true;

        if( this.currentPage > 1 )
            this.loadingMore.style.display = "block";

        //* goi API
        try
        {
            const reponse = await fetch( `https://671891927fc4c5ff8f49fcac.mockapi.io/v2?page=${this.currentPage}&limit=20` );

            //* chuyen ve json
            const newData = await reponse.json();

            if( newData.length === 0 )
                this.hasMore= false;
            else
            {
                //* Gop du lieu moi vao mang hien co
                this.data = [...this.data, ...newData];

                this.currentPage++;
            }
        } catch (error)
        {
            console.error("Error: ", error);
        }

        this.isLoading = false;

        this.loadingMore.style.display = 'none';

    }

    calculateLayout()
    {
        const containerWidth  = this.cardsGrid.offsetWidth;

        const cardWidth       = 320;

        const gap             = 20;

        this.cardsPerRow      = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1;

        const containerHeight = this.cardsContainer.clientHeight;

        this.visibleRows      = Math.ceil(containerHeight / this.cardHeight) + 1;
    }

    setupScrollListener()
    {
        this.cardsContainer.addEventListener('scroll', () => {
            this.render();

            this.checkLoadMore();
        });
    }

    setupResizeListener() 
    {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            //* Xoa timeout cu
            clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
            this.calculateLayout(); 
            this.render();    
            }, 200);
        });
    }

    checkLoadMore()
    {
        //* Lay vi tri scroll hien tai
        const scrollTop        = this.cardsContainer.scrollTop;

        const scrollHeight     = this.cardsContainer.scrollHeight;

        const clientHeight     = this.cardsContainer.clientHeight;

        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        
        if (scrollPercentage > 0.7 && !this.isLoading && this.hasMore) {
            this.loadData().then(() => {
            this.render();
            });
        }
    }

    render() 
    {
        //* Lay vi tri cuon hien tai
        const scrollTop          = this.cardsContainer.scrollTop;
        
        //* tinh hang dau tien nhin thay
        const startRow           = Math.floor(scrollTop / this.cardHeight);

        //* tinh hang bat dau render
        const adjustedStartRow   = Math.max(0, startRow - this.bufferRows);
        
        //* tinh chi so bat dau
        this.startIndex          = adjustedStartRow * this.cardsPerRow;

        //* tinh hang ket thuc hien thi
        const endRow             = startRow + this.visibleRows + (this.bufferRows * 2);

        //* tinh chi so ket thuc
        this.endIndex            = Math.min(this.data.length, endRow * this.cardsPerRow);
        
        //* tong so hang
        const totalRows          = Math.ceil(this.data.length / this.cardsPerRow);

        const totalHeight        = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';
        
        const offsetY            = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.transform = `translateY(${offsetY}px)`;
        
        const visibleData        = this.data.slice(this.startIndex, this.endIndex);
        
        this.cardsGrid.innerHTML = visibleData.map(item => this.createCard(item)).join('');
    }

    createCard(item) 
    {
        const isMale = item.genre?.toLowerCase() === 'male';
        const colorValue = item.color || '#ccc';

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
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>

                    <div class="card-item">
                        <i class="fa-solid fa-palette card-icon"></i> 
                        <strong>Color:</strong> 
                        <span class="color-box" style="background:${colorValue}"></span>
                        <span class="color-text">${colorValue}</span>
                    </div>

                    <div class="card-item"><i class="fa-solid fa-music card-icon"></i> <strong>Music:</strong> ${item.music || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map-location-dot card-icon"></i> <strong>Address:</strong> ${item.address || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-city card-icon"></i> <strong>City:</strong> ${item.city || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-map card-icon"></i> <strong>State:</strong> ${item.state || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-road card-icon"></i> <strong>Street:</strong> ${item.street || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building-columns card-icon"></i> <strong>Building:</strong> ${item.building || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-hashtag card-icon"></i> <strong>ZIP:</strong> ${item.zip || item.zipcode || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-envelope card-icon"></i> <strong>Email:</strong> ${item.email || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-phone card-icon"></i> <strong>Phone:</strong> ${item.phone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-lock card-icon"></i> <strong>Password:</strong> ${item.password || 'N/A'}</div>
                </div>
            </div>
        `;
    }

}

new VirtualCards();