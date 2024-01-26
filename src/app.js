import express from 'express'
import __dirname from './utils.js'
import handlebars from 'express-handlebars'
import { Server } from 'socket.io'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import ProductManager from './class/ProductManager.js'

const productManager = new ProductManager('./src/data/products.json')

const port = 8080
const app = express()
const httpServer = app.listen(port, () => console.log(`'Server online - PORT ${port}`))

//Socket server
const socketServer = new Server(httpServer)

//Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Templates
app.engine('handlebars', handlebars.engine())
app.set('views', __dirname + '/views')
app.set('view engine', 'handlebars')
app.use(express.static(__dirname + '/public'))

//Routes
app.use('/', productsRouter)
app.use('/', cartsRouter)

//Connection WebSocket
socketServer.on('connection', (socket) => {
    console.log('User Connected')

    sendUpdatedProducts(socket)

    async function sendUpdatedProducts(socket) {
        try {
            const updatedProducts = await productManager.getProducts()
            socket.emit('updateProducts', updatedProducts)
        } catch (error) {
            console.error("Internal server error", error)
            socket.emit('updateProducts', [])
        }
    }

    //Here logic for save 
    socket.on('addProduct', async (newProductData) => {
        try {
            const result = await productManager.addProduct(newProductData)
            socket.emit('productAdded', result)
            sendUpdatedProducts(socketServer)
        } catch (error) {
            console.error('Internal server error', error)
        }
    })

    //Here logic for delete product
    socket.on('deleteProduct', async (id) => {
        try {
            let productState = await productManager.deleteProduct(id)
            socket.emit('deleteProduct', productState)
        } catch (error) {
            console.error('Internal server error', error)
        }
    })
})