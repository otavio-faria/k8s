import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 50 },   // Ramp up para 50 usuários
    { duration: '1m', target: 100 },   // Manter 100 usuários por 1 minuto
    { duration: '30s', target: 200 },  // Aumentar para 200 usuários
    { duration: '2m', target: 200 },   // Manter 200 usuários por 2 minutos
    { duration: '20s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration': ['p(90)<500'],
    'http_req_duration{name:auth}': ['p(95)<800'],
    'http_req_duration{name:menu}': ['p(95)<400'],
    'http_req_duration{name:search}': ['p(95)<300'],
    'http_req_duration{name:order}': ['p(95)<600'],
  },
};

export default function() {
  const randomId = Math.floor(Math.random() * 10000);
  
  // Teste do AuthService
  const authPayload = JSON.stringify({
    email: `funcionario${randomId}@fasttech.com`,
    password: `senha${randomId}`
  });
  
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    tags: { name: 'auth' }
  };
  
  const authResponse = http.post(
    'http://localhost:30001/api/login', 
    authPayload, 
    authParams
  );
  
  check(authResponse, {
    'auth status 200-401': (r) => r.status >= 200 && r.status <= 401,
    'auth response has data': (r) => r.body.length > 0
  });
  
  sleep(Math.random() * 2);
  
  // Teste do MenuService
  const menuPayload = JSON.stringify({
    name: `Produto ${randomId}`,
    description: `Descrição do produto ${randomId}`,
    price: Math.random() * 50 + 10,
    available: true,
    category: "Lanche"
  });
  
  const menuResponse = http.post(
    'http://localhost:30002/api/menu-items', 
    menuPayload, 
    { 
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'menu' }
    }
  );
  
  check(menuResponse, {
    'menu status 200-201': (r) => r.status >= 200 && r.status <= 201,
    'menu response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  sleep(Math.random() * 1);
  
  // Teste do SearchService
  const searchResponse = http.get(
    'http://localhost:30003/api/search/menu-items?query=produto', 
    { tags: { name: 'search' } }
  );
  
  check(searchResponse, {
    'search status 200': (r) => r.status === 200,
    'search response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  sleep(Math.random() * 2);
  
  // Teste do OrderService
  const orderPayload = JSON.stringify({
    customerId: `customer${randomId}`,
    items: [
      {
        menuItemId: `item${randomId}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: Math.random() * 30 + 15
      }
    ],
    totalAmount: Math.random() * 50 + 20,
    deliveryType: "balcao"
  });
  
  const orderResponse = http.post(
    'http://localhost:30004/api/orders', 
    orderPayload, 
    { 
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'order' }
    }
  );
  
  check(orderResponse, {
    'order status 200-201': (r) => r.status >= 200 && r.status <= 201,
    'order response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  sleep(Math.random() * 3);
} 