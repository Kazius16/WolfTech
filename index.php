<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WolfTech - Todos los productos</title>
    <link rel="icon" type="image/x-icon" href="assets/favicon.png" />
    <link rel="stylesheet" href="css/ventas.css">
    <link href="css/tipos.css" rel="stylesheet" />

    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
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
                <li><a href="introduccion\index.php">Nosotros</a></li>
                <li><a href="#contact">Contacto</a></li>
                <li class="nav-item">
                            <a class="nav-link" href="login.php">
                              <img src="assets/img/usua.png" alt="" class="logo-image">
                            </a>
                          </li>
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
  
    </section>
         
            <div class="menu">
                <div class="seccion" id="mouse">
                    <h2>Mouse</h2>
                </div>
                <div class="seccion" id="teclados">
                    <h2>Teclados</h2>
                </div>
                <div class="seccion" id="pantallas">
                    <h2>Pantallas</h2>
                </div>
                <div class="seccion" id="portatiles" class="filter-button" data-filter="computadoras">
                    <h2>Portátiles</h2>
                </div>
                <div class="seccion" id="componentes">
                    <h2>Componentes</h2>
                </div>
            </div>
        
            <script src="script.js"></script>
        </>


    <section class="products" id="products">

        <?php

        include("conn/conexion.php");
        $query = "SELECT productos.Nombre_producto, productos.imagen, productos.Precio, marcas.marca, categorias.nom_categorias FROM productos INNER JOIN marcas ON marcas.id_marca=productos.id_marca INNER JOIN categorias ON productos.id_categoria_p=categorias.id_categoria;";
        $resultado = $conexion->query($query);
        while ($row = $resultado->fetch_assoc()) {
            ?>
            <div class="product" style="width: 16rem;" data-category="<?php echo $row["nom_categorias"]; ?>">

                <img src="data:image/jpeg;base64,<?php echo base64_encode($row['imagen']); ?>" />

                <h3><?php echo $row["Nombre_producto"]; ?></h3>
                <p>$ <?php echo number_format($row["Precio"], 0, '.', ','); ?>
                </p>
                <button class="add-to-cart">Agregar al Carrito</button>
            </div>
            <?php
        }
        ?>


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

            // Nueva animación para la imagen del hero

        });
    </script>

</body>

</html>