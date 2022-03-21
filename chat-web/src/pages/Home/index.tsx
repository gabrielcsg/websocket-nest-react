/* eslint-disable no-alert */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import * as uuid from 'uuid';

import io from 'socket.io-client';
import { Container, Content, Card, MyMessage, OtherMessage } from './styles';

interface Message {
  id: string;
  name: string;
  text: string;
}

interface Payload {
  name: string;
  text: string;
  receiver: string;
}

const Home: React.FC = () => {
  const [title] = useState('Chat');
  const [name, setName] = useState('');
  const [hiddenName, setHiddenName] = useState(false);
  const [nameReceiver, setNameReceiver] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<SocketIOClient.Socket>();

  useEffect(() => {
    function receivedMessage(message: Payload) {
      const newMessage: Message = {
        id: uuid.v4(),
        name: message.name,
        text: message.text,
      };

      setMessages([...messages, newMessage]);
    }

    if (socket)
      socket.on('msgToClient', (message: Payload) => {
        receivedMessage(message);
      });
  }, [messages, name, text, socket]);

  function validateInput() {
    return name.length > 0 && text.length > 0 && nameReceiver.length > 0;
  }

  function sendMessage() {
    if (validateInput()) {
      const message: Payload = {
        name,
        text,
        receiver: nameReceiver,
      };

      if (socket) {
        socket.emit('msgToServer', message);
        setText('');
      }
    } else {
      alert('Escreva uma mensagem');
    }
  }

  function initChat() {
    if (name.length > 0 && nameReceiver.length > 0) {
      setSocket(
        io('http://localhost:3333', {
          auth: {
            token: name,
            receiver: nameReceiver,
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
        {!hiddenName ? (
          <>
            <h1>{title}</h1>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter name..."
            />
            <input
              type="text"
              value={nameReceiver}
              onChange={e => setNameReceiver(e.target.value)}
              placeholder="Enter name receiver..."
            />
            <button type="button" onClick={() => initChat()}>
              Init
            </button>
          </>
        ) : (
          <>
            <h2>{name}</h2>
            <h2>
              To:
              {nameReceiver}
            </h2>
            <Card>
              <ul>
                {messages.map(message => {
                  if (message.name === name) {
                    return (
                      <MyMessage key={message.id}>
                        <span>
                          {message.name}
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
        )}
      </Content>
    </Container>
  );
};

export default Home;
