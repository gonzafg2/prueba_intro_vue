import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

import { db } from "../../firebase";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    productos: [],
    carrito: [],
    ventas: [],
  },
  getters: {
    cantidadCarrito(state) {
      return state.carrito.length;
    },
    productosFiltrados(state) {
      // Obtener solamente los productos con stock mayor a cero.
      const productos = state.productos.filter((pizza) => pizza.stock > 0);
      return !productos ? [] : productos;
    },
    totalCarrito(state) {
      const carrito = state.carrito;
      if (carrito.length === 0) return 0;
      const suma = carrito.reduce((acc, x) => acc + x.subtotal, 0);
      return suma;
    },
  },
  mutations: {
    cargarData(state, payload) {
      state.productos = payload;
    },
    agregarPizza(state, payload) {
      const agregar = payload.id;
      const cantidad = 1;
      const nombre = payload.nombre;
      const precio = payload.precio;
      const subtotal = precio * cantidad;

      const finder = state.carrito.find((obj) => obj.id === agregar);

      if (!finder) {
        const obj = {
          id: agregar,
          cantidad,
          nombre,
          precio,
          subtotal,
        };
        state.carrito.push(obj);
      } else {
        finder.cantidad = cantidad + finder.cantidad;
        finder.subtotal = finder.cantidad * precio;
      }
    },
    comprar(state) {
      const respuesta = confirm("¿Quieres comprar ahora?");
      // La venta debe ser un objeto que tenga las siguientes propiedades:
      // ID, Nombre, Precio Subtotal, Cantidad Vendida.
      if (respuesta) {
        const venta = state.carrito.map((obj) => {
          // Cantidad, ID, Precio, Nombre, Subtotal
          const obj2 = {
            id: obj.id,
            nombre: obj.nombre,
            precioSubtotal: obj.subtotal,
            cantidadVendida: obj.cantidad,
          };
          return obj2;
        });
        state.ventas = venta;

        // Descontar el stock en el arreglo productos según
        // la cantidad en el carrito.
        state.productos.forEach((producto) => {
          const id = producto.id;

          state.carrito.forEach((el) => {
            if (el.id === id) {
              producto.stock = producto.stock - el.cantidad;
            }
          });
        });
      }
    },
    guardarPizzasEnDB(state) {
      setTimeout(() => {
        try {
          const productos = state.productos;
          console.log(productos);
          productos.forEach(async (producto) => {
            await db.collection("pizzas").add(producto);
          });
        } catch (error) {
          console.log(error);
        }
      }, 2000);
    },
    agregarNuevaPizza(state, payload) {
      // Qué pasaría si el ID existe?
      // Validar que el ID no exista:
      const existe = state.productos.find((pizza) => pizza.id === payload.id);
      // Si no existe ingresar a la base de datos.
      if (!existe) state.productos.push(payload);
    },
  },
  actions: {
    async getData({ commit }) {
      const url =
        "https://us-central1-apis-varias-mias.cloudfunctions.net/pizzeria";
      try {
        const req = await axios(url);
        const pizzas = req.data;
        const pizzasStock = pizzas.map((obj) => {
          obj.stock = 10;
          return obj;
        });
        commit("cargarData", pizzasStock);
      } catch (error) {
        console.log(error);
      }
    },
    // async setDataPizzasDB({ commit }) {
    //   commit("guardarPizzasEnDB");
    // },
    async crearNuevaPizza({ commit }, payload) {
      const pizza = payload;
      if (!pizza) return;

      // Actualizar el state
      commit("agregarNuevaPizza", pizza);
      // Actualizar Firebase
      // Preguntar si el ID existe en Firebase: (TAREA)
      // try {
      //   const req = await db.collection("pizza").get();
      //   req.docs.forEach(obj => {
      //     const pizzaFirebase = obj.data();
      //     const idFirebase = pizzaFirebase.id;

      //     // Tiene un problema: ¿Cuál es? (Tarea)
      //     if (idFirebase === pizza.id) return;
      //     await db.collection("pizzas").add(pizza);
      //   })
      // } catch (error) {
      //   console.log(error);
      // }
      await db.collection("pizzas").add(pizza);
    },
    async borrarPizzas({ commit }, payload) {
      commit("");
      console.log(payload);
      // Delete en Firestore
      await db.collection("pizzas").doc("").delete();
    }
  },
});

// Agregar las pizzas nuevas a la BD.
// Tres instancias: 1. API. 2. Firebase. 3. Vuex


// Orden para el Desafío:
/**
 * 1. Traer la data de la API.
 * 2. Guardar solo una vez la data de la API en Firebase (Preocuparse de solo cargarla una vez. Puede hacer validaciones si quiere.)
 * 2.5. Hacer un get de la data de Firebase para obtenerla. (Si quiere puede guardarla en el arreglo Productos o crear otra variable). (Con el fin de obtener los ID's de las pizzas en Firebase)
 * 3. Crear una interfaz (formulario) para crear nuevas pizzas.
 * 3.1. Añadir Ingredientes e Imagen (Puede ser cualquier imagen).
 * 3.2. Validaciones:
 * 3.2.1. Que el ID no exista previamente tanto en Vuex (state) como en Firebase.
 * 4. Añadir a la tabla inventario un botón de eliminar pizza (Todo el registro)
 * 4.1. Pasarle el ID de Firebase para eliminar el documento.
 * 4.2. Debe validar que la pizza exista previamente.
 * 5. Opcional: Actualización del stock de la pizza.
 */