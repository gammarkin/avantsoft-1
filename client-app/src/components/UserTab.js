import { useEffect, useState } from 'react'
import { API_BASE_URL } from '@/app/config'

import { Avatar, Text, Modal, Button, TextInput, PasswordInput, Table } from '@mantine/core'
import { hasLength, isEmail, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';


import axios from 'axios'

export default function UserTab() {
  const [user, setUser] = useState({})
  const [allUsers, setAllUsers] = useState([])
  const [opened, { open, close }] = useDisclosure(false);

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

      const plusName = getPlusName(res.data.user.name)

      setUser({ ...res.data, plusName })
    }

    findUser()
  }, [])

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API_BASE_URL}/users`, {
          headers: {
            Authorization: token,
          },
        })

        setAllUsers(res.data)
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    fetchAllUsers()
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

        <Modal opened={opened} onClose={close} title="Create a new user" centered>
          <form onSubmit={form.onSubmit(async (values) => {
            const body = values

            try {
              await axios.post(`${API_BASE_URL}/users/register`, body, {
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
            <TextInput
              label="Name"
              placeholder="Enter your name"
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email"
              placeholder="Enter your email"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              {...form.getInputProps('password')}
            />
            <DatePickerInput
              label="Birth date"
              placeholder="Pick date"
              valueFormat="MM/DD/YYYY"
            />
            <Button type="submit" fullWidth mt="md">Create User</Button>
          </form>
        </Modal>

        <Avatar
          onClick={open}
          fw={900} variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          style={{ fontSize: '1.3rem', marginTop: '0.3rem', cursor: 'pointer' }}>
          +
        </Avatar>
      </header>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Date of Birth</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {allUsers.map((user) => (
            <Table.Tr key={user._id}>
              <Table.Td>
                <div style={{ display: 'flex', alignItems: 'center' }}>

                  <Avatar color="cyan" style={{ margin: '0rem 1rem' }} radius="xl">{getPlusName(user.name)}</Avatar>

                  {user.name}
                </div>
              </Table.Td>
              <Table.Td>{user.email}</Table.Td>
              <Table.Td>{user.birthDate || 'Not informed'}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </main>
  )
}
