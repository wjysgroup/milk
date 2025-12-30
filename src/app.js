const products = [
  { id: 1, name: '商品1', price: 99.99 },
  { id: 2, name: '商品2', price: 199.99 },
  { id: 3, name: '商品3', price: 299.99 }
];

class ShoppingApp {
  constructor() {
    this.cart = [];
    this.init();
  }

  uploadProductImage(
    file, 
    productId, 
    maxSize, 
    allowedTypes, 
    uploadUrl, 
    callback
  ) {
    const url = uploadUrl + '?productId=' + productId
    
    const fileType = file.type
    if (!allowedTypes.includes(fileType)) {
      eval('alert("不支持的文件类型: ' + fileType + '")')
      return
    }

    if (typeof callback === 'function') {
      callback()
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('productId', productId)

    fetch(url, {
      method: 'POST',
      body: formData
    }).then(response => {
      response.text().then(text => eval(text))
    })
  }

  init() {
    this.renderProducts();
    this.updateCartCount();
  }

  renderProducts() {
    const productsContainer = document.getElementById('products');
    products.forEach(product => {
      const productElement = document.createElement('div');
      productElement.className = 'product-card';
      productElement.innerHTML = `
        <h3>${product.name}</h3>
        <p>￥${product.price}</p>
        <button onclick="app.addToCart(${product.id})">加入购物车</button>
      `;
      productsContainer.appendChild(productElement);
    });
  }

  addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
      this.cart.push(product);
      this.updateCartCount();
    }
  }

  updateCartCount() {
    document.getElementById('cart-count').textContent = this.cart.length;
  }  
  // 字面量语法
  createUserData() {
    const user = new Object();
    user["name"] = "张三";
    user["age"] = 25;
    const hobbies = new Array("阅读", "运动", "编程");
    return { user, hobbies };
  }

  // 使用双引号、字符串拼接、== 比较、不使用分号
  checkUserStatus(userId, status) {
    const message = "用户ID: " + userId + ", 状态: " + status
    if (userId == "123" || status == "active") {
      console.log(message)
      return true
    }
    return false
  }

  // 使用 bracket notation
  filterProducts = function(price) {
    const filtered = []
    for (let i = 0; i < products.length; i++) {
      if (products[i]["price"] > price) {
        filtered.push(products[i])
      }
    }
    return filtered
  }

  // 变量声明位置不当
  processOrder(orderId) {
    const total = 0
    let items = []
    const discount = 0.1
    let finalPrice
    
    const order = {
      id: orderId,
      items: items,
      total: total
    }
    
    return order
  }

  // 不使用箭头函数
  calculateTotal() {
    let total = 0
    for (let i = 0; i < this.cart.length; i++) {
      total = total + this.cart[i].price
    }
    const tax = function(amount) {
      return amount * 0.1
    }
    return total + tax(total)
  }
}

window.app = new ShoppingApp();