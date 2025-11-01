zalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = adjustedStartRow + totalRowsToRender; 
        this.endIndex = Math.min(this.data.length, targetEndRow); 
        
        const totalRows = this.data.length; 
        const totalHeight = totalRows * this.rowHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        const offsetY = adjustedStartRow * this.rowHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleElements(); 
    }

    renderVisibleElements() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const viewToShow = this.isMobileView ? this.cardView : this.tableView;
        const viewToHide = this.isMobileView ? this.tableView : this.cardView;
        
        // Hiển thị/Ẩn đúng container
        viewToShow.style.display = 'block';
        viewToHide.style.display = 'none';
        
        // Ẩn/Hiện thanh cuộn giả
        this.fakeWrapper.style.display = this.isMobileView ? 'none' : 'block';

        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id)));

        const fragment = document.createDocumentFragment();
        
        // Xóa các phần tử cũ
        let nodesToRemove = [];
        Array.from(targetContainer.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (!newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node);
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => targetContainer.removeChild(node));
        
        // Thêm/Cập nhật các phần tử mới
        visibleData.forEach(item => {
            let element = targetContainer.querySelector(`[data-id="${item.id}"]`); 
            
            if (!element) {
                element = this.isMobileView ? this.createCardElement(item) : this.createRowElement(item);
                this.renderedCardIds.add(Number(item.id)); 
            }
            fragment.appendChild(element);
        });

        targetContainer.appendChild(fragment);
    }

    // --- HTML GENERATORS: TẠO THẺ CARD (MỚI) VÀ ROW (CŨ) ---

    createRowElement(item) {
        const tempTBody = document.createElement('tbody'); 
        tempTBody.innerHTML = String(this.createRowHTML(item)).trim();

        if (!tempTBody.firstChild || tempTBody.firstChild.nodeName !== 'TR') {
            return document.createElement('tr'); 
        }

        const rowElement = tempTBody.firstChild;
        rowElement.setAttribute('data-id', item.id); 
        return rowElement;
    }
    
    createRowHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        const badgeIcon = isMale ? 'fa-mars' : 'fa-venus';

        return `
            <tr class="data-row" data-id="${item.id}">
                <td>${item.id || 'N/A'}</td>
                <td><img src="${item.avatar}" alt="${item.name}" class="avatar-small" loading="lazy"></td>
                <td>${item.name || 'N/A'}</td>
                <td>${item.company || 'N/A'}</td>
                <td>
                    <span class="card-badge ${badgeClass}">
                        <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                    </span>
                </td>
                <td>${item.email || 'N/A'}</td>
                <td>${item.phone || 'N/A'}</td>
                
                <td>${item.dob || 'N/A'}</td>
                <td><span style="color:${item.color || '#000'}; font-weight: 700;">${item.color || 'N/A'}</span></td>
                <td>${item.timezone || 'N/A'}</td>
                <td>${item.music || 'N/A'}</td>
                <td>${item.city || 'N/A'}</td>
                <td>${item.state || 'N/A'}</td>
                
                <td>${item.address || 'N/A'}</td>
                <td>${item.street || 'N/A'}</td>
                <td>${item.building || 'N/A'}</td>
                <td>${item.zip || item.zipcode || 'N/A'}</td>
                <td>${item.createdAt || 'N/A'}</td>
                <td>${item.password || 'N/A'}</td>
            </tr>
        `;
    }
    
    createCardElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = String(this.createCardHTML(item)).trim();

        if (!tempDiv.firstChild) {
            return document.createElement('div'); 
        }

        const cardElement = tempDiv.firstChild;
        cardElement.setAttribute('data-id', item.id); 
        return cardElement;
    }
    
    // 🎯 Hàm tạo HTML Card đầy đủ styling (Đã thêm đầy đủ 19 trường)
    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const genderText = isMale ? 'Nam' : 'Nữ';
        const colorValue = item.color || '#000';

        return `
            <div class="card" data-id="${item.id}">
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                         ${genderText}
                    </span>
                </div>
                <div class="card-body">
                    <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${item.id || 'N/A'}</div>
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> <span style="color:${colorValue};">${colorValue}</span></div>
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

zalRowsToRender = this.visibleRows + 2 * this.bufferRows; 
        const targetEndRow = adjustedStartRow + totalRowsToRender; 
        this.endIndex = Math.min(this.data.length, targetEndRow); 
        
        const totalRows = this.data.length; 
        const totalHeight = totalRows * this.rowHeight;
        this.cardsSpacer.style.height = totalHeight + 'px';

        const offsetY = adjustedStartRow * this.rowHeight; 
        this.cardsContent.style.paddingTop = offsetY + 'px';

        this.renderVisibleElements(); 
    }

    renderVisibleElements() {
        const targetContainer = this.isMobileView ? this.cardView : this.tableBody;
        const viewToShow = this.isMobileView ? this.cardView : this.tableView;
        const viewToHide = this.isMobileView ? this.tableView : this.cardView;
        
        // Hiển thị/Ẩn đúng container
        viewToShow.style.display = 'block';
        viewToHide.style.display = 'none';
        
        // Ẩn/Hiện thanh cuộn giả
        this.fakeWrapper.style.display = this.isMobileView ? 'none' : 'block';

        const visibleData = this.data.slice(this.startIndex, this.endIndex);
        const newVisibleIds = new Set(visibleData.map(item => Number(item.id)));

        const fragment = document.createDocumentFragment();
        
        // Xóa các phần tử cũ
        let nodesToRemove = [];
        Array.from(targetContainer.children).forEach(node => {
            const nodeId = Number(node.dataset.id); 
            if (!newVisibleIds.has(nodeId)) {
                nodesToRemove.push(node);
                this.renderedCardIds.delete(nodeId);
            }
        });
        
        nodesToRemove.forEach(node => targetContainer.removeChild(node));
        
        // Thêm/Cập nhật các phần tử mới
        visibleData.forEach(item => {
            let element = targetContainer.querySelector(`[data-id="${item.id}"]`); 
            
            if (!element) {
                element = this.isMobileView ? this.createCardElement(item) : this.createRowElement(item);
                this.renderedCardIds.add(Number(item.id)); 
            }
            fragment.appendChild(element);
        });

        targetContainer.appendChild(fragment);
    }

    // --- HTML GENERATORS: TẠO THẺ CARD (MỚI) VÀ ROW (CŨ) ---

    createRowElement(item) {
        const tempTBody = document.createElement('tbody'); 
        tempTBody.innerHTML = String(this.createRowHTML(item)).trim();

        if (!tempTBody.firstChild || tempTBody.firstChild.nodeName !== 'TR') {
            return document.createElement('tr'); 
        }

        const rowElement = tempTBody.firstChild;
        rowElement.setAttribute('data-id', item.id); 
        return rowElement;
    }
    
    createRowHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const badgeClass = isMale ? 'badge-male' : 'badge-female';
        const badgeText = isMale ? 'Nam' : 'Nữ';
        const badgeIcon = isMale ? 'fa-mars' : 'fa-venus';

        return `
            <tr class="data-row" data-id="${item.id}">
                <td>${item.id || 'N/A'}</td>
                <td><img src="${item.avatar}" alt="${item.name}" class="avatar-small" loading="lazy"></td>
                <td>${item.name || 'N/A'}</td>
                <td>${item.company || 'N/A'}</td>
                <td>
                    <span class="card-badge ${badgeClass}">
                        <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                    </span>
                </td>
                <td>${item.email || 'N/A'}</td>
                <td>${item.phone || 'N/A'}</td>
                
                <td>${item.dob || 'N/A'}</td>
                <td><span style="color:${item.color || '#000'}; font-weight: 700;">${item.color || 'N/A'}</span></td>
                <td>${item.timezone || 'N/A'}</td>
                <td>${item.music || 'N/A'}</td>
                <td>${item.city || 'N/A'}</td>
                <td>${item.state || 'N/A'}</td>
                
                <td>${item.address || 'N/A'}</td>
                <td>${item.street || 'N/A'}</td>
                <td>${item.building || 'N/A'}</td>
                <td>${item.zip || item.zipcode || 'N/A'}</td>
                <td>${item.createdAt || 'N/A'}</td>
                <td>${item.password || 'N/A'}</td>
            </tr>
        `;
    }
    
    createCardElement(item) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = String(this.createCardHTML(item)).trim();

        if (!tempDiv.firstChild) {
            return document.createElement('div'); 
        }

        const cardElement = tempDiv.firstChild;
        cardElement.setAttribute('data-id', item.id); 
        return cardElement;
    }
    
    // 🎯 Hàm tạo HTML Card đầy đủ styling (Đã thêm đầy đủ 19 trường)
    createCardHTML(item) {
        const isMale = item.genre?.toLowerCase() === 'male';
        const genderText = isMale ? 'Nam' : 'Nữ';
        const colorValue = item.color || '#000';

        return `
            <div class="card" data-id="${item.id}">
                <div class="card-header">
                    <img src="${item.avatar}" alt="${item.name}" class="avatar" loading="lazy">
                    <div class="card-info">
                        <div class="card-name">${item.name || 'N/A'}</div>
                        <div class="card-company">${item.company || 'N/A'}</div>
                    </div>
                    <span class="card-badge ${isMale ? 'badge-male' : 'badge-female'}">
                         ${genderText}
                    </span>
                </div>
                <div class="card-body">
                    <div class="card-item"><i class="fa-solid fa-id-badge card-icon"></i> <strong>ID:</strong> ${item.id || 'N/A'}</div>
                    <div class="card-item"><i class="fa-regular fa-calendar-plus card-icon"></i> <strong>Created At:</strong> ${item.createdAt || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-user card-icon"></i> <strong>Name:</strong> ${item.name || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-venus-mars card-icon"></i> <strong>Genre:</strong> ${item.genre || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-building card-icon"></i> <strong>Company:</strong> ${item.company || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-calendar-days card-icon"></i> <strong>DOB:</strong> ${item.dob || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-clock card-icon"></i> <strong>Timezone:</strong> ${item.timezone || 'N/A'}</div>
                    <div class="card-item"><i class="fa-solid fa-palette card-icon"></i> <strong>Color:</strong> <span style="color:${colorValue};">${colorValue}</span></div>
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

new ResponsiveVirtualView();    