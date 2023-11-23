# cat-paw-ecommerce
#### Video Demo: https://www.youtube.com/watch?v=xuxEhRzp3uE
#### Description:
my website: https://catpawsshop.onrender.com/
Admin account for admin view:
Username: admin
Password: 1234

my github of this project: https://github.com/somruethai-23/cat-paw-ecommerce

ecommerce website selling cat product using Node.js express and using MongoDB as a database. I'm using about a month or maybe nearly two months for this project. I loose track of time.

So I want to be fullstack developer for my first job, so I want to do frontend and backend with Node.js(In Thailand it was the most popular),
So first of all I seperate folders trying to make it looks organizaed, I using routes so my app.js won't look crazy and it was more organized.

I make index.ejs as shopping page and navbar having about us and contact us, it was ecommerce website, so I have admin view and user view.

All you can do in my website,
As customer:
1. Buying things
2. sorting the products you want to buy by categories
3. read more information of the products
4. paying for order
5. keep track of order
6. Profile (Change password / edit address / Ordertracking)

As Admin:
1. Manage Order ( edit / change status)
3. Manage Product (add / change status / edit)
4. Dashbaord

- Routes Admin will be about managing product, orders and dashboard for keeping up with income and looks for data such as most selling products and also pending request to remind admin not to forget to shipped the product.

- Products, at first I was coding for deleted, and it was deleted from the database and that causing bugs as the order that was order the deleted products can't find it anymore. So I was making it to status 'active', 'onhold'(for products that out of stock but will get it in future), and 'inactive' for the products that admin doesn't want to sell anymore.

- Dashboard, I was struggling with chart.js, as it doesn't appeared, stuck with it for 2 days, and the only thing I can do to solve this problem is to not use the ejs layout(Which it help you to put navbar and footer and layout for every page, so you don't have to spend time doing it overagain every single page).

- Paying System, I don't know much about requesting API in such serious business such as using BANK, so I was just coding for customer to transfer the money by scanning my promtpay and then send the picture as evidence for admin to check and then shipped for customer.

- Routes Order is what I have problem with the most, as I can't really planning for shopping cart to payment to qrcode page, and I keep changing code so it was a messed but I got some of advice of how it should be by my boyfriend(he's Java developer) but it didn't help much.

- Online storing picture, I use firebase storage for free(all of my project must be free).

- Mostly bootstrap I got from template and fixing it to the way I want myself, example of website I got templated from is
 1.https://startbootstrap.com/theme/sb-admin-2
 2. https://getbootstrap.com/docs/4.0/examples/
 etc.

- For deployed I was using lots before I ended up to use Render.com as many of the deploying didn't recognized node.js, or maybe I didn't research enough but when I do it most didn't shown up so I went to youtube and got Render as to deployed my website, I was stuck in render for 4-5 problems before it went live.

- I use lots of Node packages,
https://www.npmjs.com/
there's lots of things I can use via Node packages and I use lots of them, some of it exists in my project but didn't use them because I tried many of them, some of them works some of them not working the way I want and I may didn't delete it out of my project.

- for decorations or frontend, I think my website looks ok to me, somehow I think it could be more beautiful and my style just like minimal and simple. But when I tried to put background image or other things it becomes messy so I prefer simple and minimal. As you can see, the header image have water mark but I cannot do anything, I really likes that image and I'm sorry for water mark but it was use for ecommerce so I must have water mark (if I'm not wrong).
I'm struggling the most with Your order or Ordertrack page, it was really hard to make it looks good, and I'm not that expert to do the status of shipping like others ecommemrce platform such as Lazada, Shoppee etc. So all I can do here is to put tracking number and the shipped company for customer to keep track of items or products they ordered. I'm sorry but this is huge project for me to do alone and I just started learning for 5-6 months before learning with this course(and I was learning Java before). So many of them are not perfect but it was an experience for me.
