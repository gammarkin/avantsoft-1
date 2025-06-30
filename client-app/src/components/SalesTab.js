import { useEffect, useState } from 'react'
import { API_BASE_URL } from '@/app/config'

import { Avatar, Text, Modal, Button, TextInput, Table } from '@mantine/core'
import { hasLength, isEmail, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';

import axios from 'axios'

export default function SalesTab() {
  const [user, setUser] = useState({})
  const [sales, setSales] = useState([])
  const [opened, { open, close }] = useDisclosure(false);
  const [clientStats, setClientStats] = useState([])

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name: hasLength({ min: 3 }, 'Must be at least 3 characters'),
      email: isEmail('Invalid email'),
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  useEffect(() => {
    const findUser = async () => {
      const token = localStorage.getItem('token')

      const res = await axios.get(`${API_BASE_URL}/users/confirm?token=${token}`, {
        headers: {
          Authorization: token,
        },
      })

      const plusName = (() => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'
        const name = res.data.user.name.toLowerCase()
        const usedLetters = new Set(name.replace(/[^a-z]/g, ''))

        for (let letter of alphabet) {
          if (!usedLetters.has(letter)) {
            return letter.toUpperCase()
          }
        }
        return '-'
      })()

      setUser({ ...res.data, plusName })
    }

    findUser()
  }, [])

  useEffect(() => {
    const fetchSalesData = async () => {
      const token = localStorage.getItem('token')

      try {
        const response = await axios.get(`${API_BASE_URL}/sales/`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            authorization: token,
          }
        });

        setSales(response.data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    };

    const fetchClientStats = async () => {
      const token = localStorage.getItem('token')

      try {
        const response = await axios.get(`${API_BASE_URL}/sales/clients-stats`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            authorization: token,
          }
        });

        setClientStats(response.data);
        console.log('Client stats:', response.data);
      } catch (error) {
        console.error('Error fetching client stats:', error);
      }
    }

    fetchSalesData();
    fetchClientStats();
  }, [opened]);

  const getPlusName = (username) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    const name = username.toLowerCase()
    const usedLetters = new Set(name.replace(/[^a-z]/g, ''))

    for (let letter of alphabet) {
      if (!usedLetters.has(letter)) {
        return letter.toUpperCase()
      }
    }
    return '-'
  }

  return (
    <main style={{ width: '100dvw', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ margin: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar color="cyan" radius="xl">{user.plusName}</Avatar>

          <Text size="xl" fw={900} variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }} style={{ fontSize: '1.3rem', marginLeft: '1rem', marginTop: '0.3rem' }}>
            {user.user?.name}
          </Text>
        </div>

        <div>
          <Modal opened={opened} onClose={close} title="Create a new user" centered>
            <form onSubmit={form.onSubmit(async (values) => {
              const body = values

              try {
                await axios.post(`${API_BASE_URL}/sales/`, body, {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json',
                  }
                })

                close();
              } catch (err) {
                console.error(err);
              }
            })}>

              <TextInput style={{ width: '100%' }} {...form.getInputProps('product')} label="Product" placeholder="Product" />
              <TextInput style={{ width: '100%' }} {...form.getInputProps('user')} mt="md" label="User" placeholder="User" />
              <DatePickerInput style={{ width: '100%' }} {...form.getInputProps('date')} mt="md" label="Date" placeholder="Pick date" />
              <TextInput style={{ width: '100%' }} {...form.getInputProps('quantity')} mt="md" label="Quantity" placeholder="Quantity" />
              <TextInput style={{ width: '100%' }} {...form.getInputProps('price')} mt="md" label="Price" placeholder="Price" />
              <TextInput style={{ width: '100%' }} {...form.getInputProps('total')} mt="md" label="Total" placeholder="Total" />
              <Button type="submit" fullWidth mt="md">Create Sale</Button>
            </form>
          </Modal>

          <Avatar
            onClick={open}
            fw={900} variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            style={{ fontSize: '1.3rem', marginTop: '0.3rem', cursor: 'pointer' }}>
            +
          </Avatar>
        </div>
      </header>

      <section style={{ margin: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Text size="xl" fw={900} variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }} style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
          Sales Tab
        </Text>

        <Text>Sales data will be displayed here.</Text>

        <Text style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Client Statistics</Text>

        <div style={{ width: '100dvw', marginTop: '1rem', display: 'flex', justifyContent: 'space-evenly', gap: '1rem' }}>
          <div>

            <Text style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Biggest Buyer</Text>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Total Quantity Sold</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clientStats.biggestBuyer?.map((client) => (
                  <Table.Tr key={client.name}>
                    <Table.Td>{client.name}</Table.Td>
                    <Table.Td>{client.totalQuantity}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <div>

            <Text style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Biggest Spender (Medium)</Text>

            <Table style={{ marginTop: '0.5rem' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Total Spent</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clientStats.biggestSpenderMedium?.map((client) => (
                  <Table.Tr key={client.name}>
                    <Table.Td>{client.name}</Table.Td>
                    <Table.Td>{client.totalSpent.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <div>

            <Text style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Biggest Spender (Day Spree)</Text>

            <Table style={{ marginTop: '0.5rem' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Total Spent</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {clientStats.biggestSpenderDaySpree?.map((client) => (
                  <Table.Tr key={`${client.name}-${client.date}`}>
                    <Table.Td>{client.name}</Table.Td>
                    <Table.Td>{client.date}</Table.Td>
                    <Table.Td>{client.totalSpent.toFixed(2)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <Text style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Sales Statistics</Text>

        <Table style={{ marginTop: '2rem', width: '100%' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Product</Table.Th>
              <Table.Th>Date of sale</Table.Th>
              <Table.Th>Price</Table.Th>
              <Table.Th>Quantity</Table.Th>
              <Table.Th>Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sales.map((sale) => (
              <Table.Tr key={sale._id}>
                <Table.Td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>

                    <Avatar color="cyan" style={{ margin: '0rem 1rem' }} radius="xl">{getPlusName(sale.user)}</Avatar>

                    {sale.user}
                  </div>
                </Table.Td>
                <Table.Td>{sale.date}</Table.Td>
                <Table.Td>{sale.price}</Table.Td>
                <Table.Td>{sale.product}</Table.Td>
                <Table.Td>{sale.quantity}</Table.Td>
                <Table.Td>{sale.total}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

      </section>
    </main>

  )
}
