Ext.define('Jarvus.touch.widget.FishView', {
    extend: 'Ext.dataview.DataView',
	xtype: 'fishview',
	requires: [
		'Ext.util.DelayedTask'
	],

	config: {
		scaleMax: 0.8,
		scaleMin: 0.45,
        itemSize: 300,
		
		cls: 'fishview',
		scrollable: {
			direction: 'horizontal'
		},
		inline: {wrap: false},
		itemCls: 'fishview-item',
		itemTpl: [
			'<div class="fishview-image-ct">',
				'<div class="fishview-image" style="background-image:url({photoUrl})">',
			'</div>',
            '<tpl if="caption">',
			    '<div class="fishview-caption">{caption}</div>',
            '</tpl>'
		],
		emptyText: 'No images found.'
	},
	
	
	// @override
	initialize: function() {
		var me = this;
		
		me.callParent();
		
		me.getScrollable().getScroller().on({
			scope: me,
			scroll: 'onScroll',
			scrollend: 'onScrollEnd'
		});
		
		me.on({
            scope: me,
            resize: 'onResize'
//            selectionchange: 'onSelectionChange'
		});
		
		me.autoSelectTask = Ext.create('Ext.util.DelayedTask', me.autoSelect, me);
	},
    
    updateItemSize: function(itemSize) {
        this.getScrollable().getScroller().setSlotSnapSize(itemSize);
//        console.log(itemSize);
    },
	
	/**
	 * @override
	 * Updates itemWidth and itemMidWidth
	 */
	doRefresh: function(me) {
		me.callParent([me]);
		
		var items = me.getViewItems();
		
		if(items.length) {
			me.itemMidWidth = (me.itemWidth = items[0].offsetWidth) / 2;
			me.syncViewSize();
		}

        me.setItemSize(me.itemWidth);
        console.log('setItemSize', me.itemWidth);
	},
	
	// @override
	onItemTap: function(container, target, index) {
		var me = this;
		
		me.autoSelectTask.cancel();
		me.callParent(arguments);
		me.scrollToIndex(index);
	},
	
	
	// event handlers
	onScroll: function(scroller, x, y) {
		this.autoSelectTask.cancel();
		this.syncItemsScale(x, scroller);
	},
	
	onScrollEnd: function() {
		this.autoSelectTask.delay(250);
	},
	
//    onSelectionChange: function(me, records) {
//        me.scrollToIndex((records.length && me.getStore().indexOf(records[0])) || 0);
//    },

	/**
	 * Updates containerWidth and containerMidWidth
	 */
	onResize: function(element, size) {
		var me = this,
			selectedRecord = me.getSelection()[0];
		
		me.containerMidWidth = (me.containerWidth = size.contentWidth) / 2;
		me.doRefresh(this);
		
//		// sync scroll position if itemWidth has already been calculated
//		if(me.itemWidth && selectedRecord && !me.isScrolling) {
//			me.scrollToIndex(me.getStore().indexOf(selectedRecord));
//		}
	},
	
	// view methods
	autoSelect: function() {
		var me = this,
			index = Math.round(me.getScrollable().getScroller().position.x / me.itemWidth);

		if(index < me.getStore().getCount()) {
			me.select(index);
		}
	},
	
	scrollToIndex: function(index) {
		var me = this,
			scroller = me.getScrollable().getScroller(),
			scrollTarget = index * me.itemWidth;

        if (!me.rendered) {
            me.on('painted', function() {
                me.scrollToIndex(index);
            }, me, {single: true});
            return;
        }

		scroller.stopAnimation();

		if(scroller.position.x != scrollTarget) {
			// defer scroll so that current touch doesn't cancel it
			Ext.defer(function() {
				scroller.scrollTo(scrollTarget, 0, true);
			}, 100);
		}
	},
	
	syncViewSize: function() {
		var me = this,
			itemWidth = me.itemWidth,
			containerMidWidth = me.containerMidWidth,
			containerPadding;
			
		// wait for resize and render to have happened
		if(!itemWidth || !containerMidWidth) {
			return;
		}
	
		// apply padding to item container
		containerPadding = containerMidWidth - itemWidth / 2;
		
		me.container.element.setStyle({
			paddingLeft: containerPadding + 'px',
			paddingRight: containerPadding + 'px'
		});
		
		// calculate how many items fit in the container at once
		me.itemsPerContainer = me.containerWidth / itemWidth;
		
		// force sync
		me.syncItemsScale(me.getScrollable().getScroller().position.x);
	},
	
	syncItemsScale: function(x, scroller) {
		var me = this,
			scaleMin = me.getScaleMin(),
			scaleMax = me.getScaleMax(),
			scaleRange = scaleMax - scaleMin,
			items = this.getViewItems(),
			itemWidth = me.itemWidth,
			itemsPerContainer = me.itemsPerContainer,
			itemsPerSide = itemsPerContainer / 2,
			centerItemIndex = x / itemWidth,
			i = Math.max(0, Math.floor((x + me.itemMidWidth - me.containerMidWidth) / itemWidth)),
			max = Math.min(Math.ceil(i + itemsPerContainer), items.length-1),
			scale;
			
		scroller = scroller || me.getScrollable().getScroller();
		
		for(; i <= max; i++) {
			scale = scaleMax - (Math.abs(i - centerItemIndex) / itemsPerSide) * scaleRange;
			items[i].style.webkitTransform = 'scale3d('+scale+', '+scale+', 1)';
		}
	}
});