import { test, expect } from '@playwright/test';

const baseURL = 'https://juice-shop.herokuapp.com';
const email = 'jim@juice-sh.op'; // Replace with valid email
const password = 'ncc-1701'; // Replace with valid password hash

test.describe('Basket Operations', () => {

  let token;
  let bid

  test.beforeAll(async ({ request }) => {
    // Login to get the token
    const loginResponse = await request.post(`${baseURL}/rest/user/login`, {
      data: {
        email,
        password
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    token = loginData.authentication.token;
    bid = loginData.authentication.bid;
    console.log('Token:', token); 
    console.log('BID:', bid); // For debugging, remove in production
  });

  test('Add 1 item to the basket and verify', async ({ request }) => {
    // Add item to the basket
    const baskets = bid;
    const addItemResponse = await request.post(`${baseURL}/api/BasketItems`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        BasketId: baskets,
        ProductId: 1,

        quantity: 1
      }
    });

    console.log('Add Item Response:', addItemResponse.status(), await addItemResponse.text());
    expect(addItemResponse.ok()).toBeTruthy();

    // Verify that the item was added to the basket
    const basketResponse = await request.get(`${baseURL}/rest/basket/${bid}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Basket Response:', basketResponse.status(), await basketResponse.text());
    const basketData = await basketResponse.json();
    expect(basketData.data.Products.length).toBe(1);
  });

  test('Sign in user, add 2 items to the basket, delete 1 item, and verify only 1 item remains', async ({ request }) => {
    // Add first item to the basket
    const baskets = bid;
    const addItemResponse = await request.post(`${baseURL}/api/BasketItems`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {

        ProductId: 1, // Replace with valid product ID
        BasketId: baskets,
        quantity: 1
      }
    });

    console.log('Add Item 1 Response:', addItemResponse.status(), await addItemResponse.text());
    expect(addItemResponse.ok()).toBeTruthy();

    // Add second item to the basket
    const addItem2Response = await request.post(`${baseURL}/api/BasketItems`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        BasketId: baskets,
        ProductId: 24, // Replace with valid product ID
        quantity: 1
      }
    });

    console.log('Add Item 2 Response:', addItem2Response.status(), await addItem2Response.text());
    expect(addItem2Response.ok()).toBeTruthy();

 // Fetch basket items to get item IDs
 const basketItemsResponse = await request.get(`${baseURL}/rest/basket/${bid}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

if (!basketItemsResponse.ok()) {
  const responseBody = await basketItemsResponse.text();
  console.error('Basket Items Response Error:', basketItemsResponse.status(), responseBody);
  throw new Error('Failed to fetch basket items');
}
    // Delete one item from the basket
    const basketItemsData = await basketItemsResponse.json();
    const items = basketItemsData.data.Products;
    expect(items.length).toBeGreaterThan(0);
    const itemIdToDelete = items[0].BasketItem.id;
    console.log('Item ID to Delete:', itemIdToDelete); // For debugging, remove in production

    // Delete one item from the basket
    const deleteItemResponse = await request.delete(`${baseURL}/api/BasketItems/${itemIdToDelete}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Delete Item Response:', deleteItemResponse.status(), await deleteItemResponse.text());
    expect(deleteItemResponse.ok()).toBeTruthy();

    // Verify that only 1 item remains in the basket
    const basketResponse = await request.get(`${baseURL}/rest/basket/${bid}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Basket Response:', basketResponse.status(), await basketResponse.text());
    const basketData = await basketResponse.json();
    expect(basketData.data.Products.length).toBe(1);
  });

});
