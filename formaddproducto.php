<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WolfTech - Todos los productos</title>
    <link rel="icon" type="image/x-icon" href="assets/favicon.png" />
    <link rel="stylesheet" href="css/ventas.css">
</head>

<body>
    <header>
        <div class="logo">
            <a>WolfTech</a>
        </div>
        <nav>
            <ul>
                <li><a href="http://localhost/WolfTech/ventas/startbootstrap-shop-homepage-gh-pages/">Inicio</a></li>
                <li><a href="#products">Productos</a></li>
                <li><a href="#about">Nosotros</a></li>
                <li><a href="#contact">Contacto</a></li>
                <li><a href="#add-product">Agregar Producto</a></li>
            </ul>
        </nav>
        <div class="cart-icon" id="cartIcon">🛒</div>
    </header>

    <section class="hero" id="home">
        <div class="hero-content">
            <h1>Tecnología del Futuro, Hoy</h1>
            <p>Descubre nuestros productos innovadores que transformarán tu vida digital</p>
            <button class="cta-button">Explora Ahora</button>
        </div>
    </section>

    <section class="filters">
        <button class="filter-button active" data-filter="all">Todos</button>
        <button class="filter-button" data-filter="computadoras">Computadoras</button>
        <button class="filter-button" data-filter="audio">Audio</button>
        <button class="filter-button" data-filter="accesorios">Accesorios</button>
        <button class="filter-button" data-filter="monitores">Monitores</button>
    </section>


    <!-- Sección para agregar un nuevo producto -->
    <section class="add-product" id="add-product">
        <h2>Agregar Nuevo Producto</h2>
        <form action="submit_product.php" method="post" enctype="multipart/form-data">
            <label for="nombre_producto">Nombre del Producto:</label>
            <input type="text" id="nombre_producto" name="nombre_producto" required>

            <label for="imagen">Imagen del Producto:</label>
            <input type="file" id="imagen" name="imagen" accept="image/*" required>

            <label for="precio">Precio:</label>
            <input type="number" id="precio" name="precio" step="0.01" required>

            <label for="marca">Marca:</label>
            <input type="text" id="marca" name="marca" required>

            <label for="categoria">Categoría:</label>
            <input type="text" id="categoria" name="categoria" required>

            <button type="submit">Agregar Producto</button>
        </form>
       </section>

    <footer>
        <p>&copy; 2023 TechStore. Todos los derechos reservados.</p>
    </footer>

    <div class="modal-overlay" id="modalOverlay"></div>
    <div class="cart-modal" id="cartModal">
        <h2>Tu Carrito</h2>
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-total" id="cartTotal"></div>
        <button class="close-modal" id="closeModal">Cerrar</button>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const cartIcon = document.getElementById('cartIcon');
            const cartModal = document.getElementById('cartModal');
            const closeModal = document.getElementById('closeModal');
            const modalOverlay = document.getElementById('modalOverlay');
            const addToCartButtons = document.querySelectorAll('.add-to-cart');
            const cartItems = document.getElementById('cartItems');
            const cartTotal = document.getElementById('cartTotal');
            const filterButtons = document.querySelectorAll('.filter-button');
            const products = document.querySelectorAll('.product');
            let cart = [];

            cartIcon.addEventListener('click', openModal);
            closeModal.addEventListener('click', closeModalFunction);
            modalOverlay.addEventListener('click', closeModalFunction);

            addToCartButtons.forEach(button => {
                button.addEventListener('click', addToCart);
            });

            filterButtons.forEach(button => {
                button.addEventListener('click', filterProducts);
            });

            function openModal() {
                cartModal.style.display = 'block';
                modalOverlay.style.display = 'block';
                updateCartDisplay();
            }

            function closeModalFunction() {
                cartModal.style.display = 'none';
                modalOverlay.style.display = 'none';
            }

            function addToCart(event) {
                const product = event.target.closest('.product');
                const productName = product.querySelector('h3').textContent;
                const productPrice = parseFloat(product.querySelector('p').textContent.replace('$', ''));

                cart.push({ name: productName, price: productPrice });
                updateCartDisplay();

                // Animación de agregar al carrito
                const clone = product.cloneNode(true);
                clone.style.position = 'fixed';
                clone.style.zIndex = '1000';
                clone.style.transition = 'all 1s ease-in-out';
                clone.style.top = `${event.clientY}px`;
                clone.style.left = `${event.clientX}px`;
                document.body.appendChild(clone);

                setTimeout(() => {
                    const rect = cartIcon.getBoundingClientRect();
                    clone.style.top = `${rect.top}px`;
                    clone.style.left = `${rect.left}px`;
                    clone.style.transform = 'scale(0.1)';
                    clone.style.opacity = '0';
                }, 0);

                setTimeout(() => {
                    document.body.removeChild(clone);
                }, 1000);
            }

            function updateCartDisplay() {
                cartItems.innerHTML = '';
                let total = 0;

                cart.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.textContent = `${item.name} - $${item.price.toFixed(2)}`;
                    cartItems.appendChild(itemElement);
                    total += item.price;
                });

                cartTotal.textContent = `Total: $${total.toFixed(2)}`;
            }

            function filterProducts(event) {
                const filter = event.target.getAttribute('data-filter');

                filterButtons.forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');

                products.forEach(product => {
                    if (filter === 'all' || product.getAttribute('data-category') === filter) {
                        product.style.display = 'block';
                    } else {
                        product.style.display = 'none';
                    }
                });
            }
        });
    </script>

</body>

</html>
