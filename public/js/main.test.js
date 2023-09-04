const $ = require('jquery');
const axios = require('axios');
const jsdom = require('jsdom-global');
const { TextEncoder, TextDecoder } = require('text-encoding');
// Mock Axios for AJAX calls
jest.mock('axios');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// Initialize jsdom globally
const cleanup = jsdom();




describe('Chat Form Submission Tests', () => {
    let eventPreventDefaultMock;
    let formHtml;
    let form;
  
    beforeEach(() => {
      // Create a mock event with a preventDefault function
      eventPreventDefaultMock = jest.fn();
      const mockEvent = {
        preventDefault: eventPreventDefaultMock,
      };
  
      // Create a simple form in HTML
      formHtml = `
        <form id="chat-form">
          <input type="text" id="message" value="Test Message" />
          <button type="submit">Submit</button>
        </form>
        <div id="chat-container"></div>
      `;
  
      // Attach the form and chat-container to the document body
      document.body.innerHTML = formHtml;
  
      // Get a reference to the form
      form = document.getElementById('chat-form');
  
      // Reset Axios mock
      axios.post.mockReset();
    });
  
    afterEach(() => {
      // Clean up the form, chat-container, and reset the document body
      document.body.innerHTML = '';
    });
  
    test('Form submission makes an AJAX call', async () => {
      // Mock Axios response data
      const responseDataMock = {
        data: {
          success: true,
          data: {
            _id: '123',
            message: 'Test Message',
          },
        },
      };
  
      // Mock the Axios post method to resolve with the response data
      axios.post.mockResolvedValue(responseDataMock);
  
      // Attach the form submission event handler using jQuery
      $('#chat-form').submit(async function (event) {
        event.preventDefault();
  
        try {
          // Your form submission code here
          const message = $('#message').val();
  
          const responseData = await $.ajax({
            url: "/save-chat",
            type: "POST",
            data: JSON.stringify({
              sender_id: 'sender_id_value',
              receiver_id: 'receiver_id_value',
              message: message,
            }),
            contentType: "application/json; charset=utf-8",
          });
  
          // Process responseData here
          if (responseData.success) {
            $('#message').val("");
            const chat = responseData.data.message;
            const html = `
              <div class="current-user-chat"  id="${responseData.data._id}">
                <h5>${chat}
                  <i class="fa fa-trash" aria-hidden="true" data-id="${responseData.data._id}"></i>
                </h5>
              </div>
            `;
            $('#chat-container').append(html);
            // socket.emit('newChat', responseData.data); // You may need to mock 'socket' for testing
  
            // scrollChat(); // You may need to mock 'scrollChat' for testing
          } else {
            alert(responseData.message);
          }
        } catch (error) {
          // Handle errors here, e.g., log them or fail the test
        //   console.error(error);
          throw error; // Re-throw the error to fail the test
        }
      });
  
      // Trigger the form submission manually
      $(form).submit();
  
      // Verify that preventDefault was called
      expect(eventPreventDefaultMock).toHaveBeenCalledTimes(1);
  
      // Wait for the AJAX call to complete
      await new Promise((resolve) => setTimeout(resolve, 0)); // Allow for promise resolution
  
      // Verify that the AJAX call was made to the correct URL and with the correct data
      expect(axios.post).toHaveBeenCalledWith('/save-chat', {
        sender_id: 'sender_id_value',
        receiver_id: 'receiver_id_value',
        message: 'Test Message',
      });
  
      // Add assertions for the expected behavior after the AJAX call
      // For example, check that the message was added to the chat container
      expect($('#chat-container').html()).toContain('Test Message');
    });
  
    // Add more test cases as needed
  });
  
  // Clean up the jsdom global environment after all tests
  afterAll(() => {
    cleanup();
  });

