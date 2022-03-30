/* eslint-disable camelcase */
/* eslint-disable no-alert */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import * as uuid from 'uuid';
import axios from 'axios';

import io from 'socket.io-client';
import { Container, Content, Card, MyMessage, OtherMessage } from './styles';

interface Message {
  id: string;
  sender_id: string;
  name: string;
  text: string;
}

interface Payload {
  text: string;
  name: string;
  sender_user_id: string;
  receiver_id: string;
}

interface User {
  id: string;
  name: string;
  token: string;
}

const Home: React.FC = () => {
  const [title] = useState('Chat');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User>({} as User);
  const [hiddenLogin, setHiddenLogin] = useState(false);
  const [hiddenName, setHiddenName] = useState(true);
  const [idReceiver, setIdReceiver] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<SocketIOClient.Socket>();

  useEffect(() => {
    function receivedMessage(message: Payload) {
      const newMessage: Message = {
        id: uuid.v4(),
        name: message.name,
        sender_id: message.sender_user_id,
        text: message.text,
      };

      setMessages([...messages, newMessage]);
    }

    if (socket)
      socket.on('msgToClient', (message: Payload) => {
        receivedMessage(message);
      });
  }, [messages, text, socket]);

  function validateInput() {
    return text.length > 0 && idReceiver.length > 0;
  }

  function sendMessage() {
    if (validateInput()) {
      const message: Payload = {
        text,
        sender_user_id: user.id,
        name: user.name,
        receiver_id: idReceiver,
      };

      if (socket) {
        socket.emit('msgToServer', message);
        setText('');
      }
    } else {
      alert('Escreva uma mensagem');
    }
  }

  async function handleLogin() {
    if (login && password) {
      try {
        const response = await axios.post('http://localhost:3003/auth/login', {
          email: login,
          password,
        });

        setUser({
          id: response.data.user.id,
          name: response.data.user.name,
          token: response.data.access_token,
        });

        setHiddenLogin(true);
        setHiddenName(false);
      } catch (error) {
        alert('erro login');
      }
    } else {
      alert('Preencha os campos');
    }
  }

  function initChat() {
    if (idReceiver.length > 0) {
      setSocket(
        io('http://localhost:3004', {
          auth: {
            token: user?.token,
            receiver_id: idReceiver,
          },
        }),
      );

      setHiddenName(true);
    } else {
      alert('Preencha os campos');
    }
  }

  return (
    <Container>
      <Content>
        {!hiddenLogin && (
          <>
            <h1>{title}</h1>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Login"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
            />
            <button type="button" onClick={() => handleLogin()}>
              Login
            </button>
          </>
        )}
        {hiddenLogin &&
          (!hiddenName ? (
            <>
              <input
                type="text"
                value={idReceiver}
                onChange={e => setIdReceiver(e.target.value)}
                placeholder="Enter id receiver..."
              />
              <button type="button" onClick={() => initChat()}>
                Init
              </button>
            </>
          ) : (
            <>
              <h2>
                To:
                {idReceiver}
              </h2>
              <Card>
                <ul>
                  {messages.map(message => {
                    if (message.sender_id === user?.id) {
                      return (
                        <MyMessage key={message.id}>
                          <span>
                            {user?.name}
                            {' diz:'}
                          </span>

                          <p>{message.text}</p>
                        </MyMessage>
                      );
                    }

                    return (
                      <OtherMessage key={message.id}>
                        <span>
                          {message.name}
                          {' diz:'}
                        </span>

                        <p>{message.text}</p>
                      </OtherMessage>
                    );
                  })}
                </ul>
              </Card>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Enter message..."
              />
              <button type="button" onClick={() => sendMessage()}>
                Send
              </button>
            </>
          ))}
      </Content>
    </Container>
  );
};

export default Home;
