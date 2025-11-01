class VirtualCards 
{
    constructor() 
    {
        this.data        = [];  //* chua du lieu card tu API
        this.cardHeight  = 250; //* chieu cao moi card
        this.cardPerRow  = 0;   //* so luong card tren moi hang
        this.visibleRow  = 0    //* so hang thuc te tren man viewport
        this.bufferRow   = 0    //* so hang tai them
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
        
        this.calculateLayout();
        this.setUpScrollListener();
        this.setupResizeListener();
        this.render();

        this.loader.style.display = 'none';
        this.cardsContainer.style.display = 'block';
    }

    async loadData()
    {
        //* Neu dang tai hoac het du lieu -> thoat
        if( this.isLoading || this.hasMore )
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
            const newData = await reponse.json;

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

    setUpScrollListener()
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

        //* tinh hang ket thuc hien
        const endRow             = startRow + this.visibleRows + (this.bufferRows * 2);

        this.endIndex            = Math.min(this.data.length, endRow * this.cardsPerRow);
        
        const totalRows          = Math.ceil(this.data.length / this.cardsPerRow);

        const totalHeight        = totalRows * this.cardHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';
        
        const offsetY            = adjustedStartRow * this.cardHeight;
        this.cardsContent.style.transform = `translateY(${offsetY}px)`;
        
        const visibleData        = this.data.slice(this.startIndex, this.endIndex);
        
        this.cardsGrid.innerHTML = visibleData.map(item => this.createCard(item)).join('');
    }

}