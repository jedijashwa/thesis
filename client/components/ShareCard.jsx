// Set default values for contents (body) and subject of messages.
var messageDefaults = {
  contents: 'Check out irl! www.irl.events',
  subject: 'Check out irl',
  url: 'www.irl.events'
};

// Loads SMS share option if device is iOS or Android.
// Fully functional on iOS and Android in built-in browser.
// Not tested in 3rd-party browsers yet.
var ShareSMS = React.createClass({
  getDefaultProps: function () {
    return {contents: messageDefaults.contents};
  },

  getInitialState: function () {
    var state = {
      iOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
      android: /(android)/i.test(navigator.userAgent)
    }

    if (state.iOS) {
      state.formatted = 'sms:&body=';
    } else {
      state.formatted = 'sms:?body=';
    }
    return state;
  },

  render: function () {
    if (this.state.android || this.state.iOS) {
      return (
        <a href={this.state.formatted.concat(this.props.contents)} className="sms">
          <i className="material-icons">message</i>
        </a>
      );
    } else {
      return null;
    }
  }
});

// Share via email.
var ShareEmail = React.createClass({
  getDefaultProps: function () {
    return {
      contents: messageDefaults.contents,
      subject: messageDefaults.subject
    }
  },

  render: function () {
    return (
      <a href={"mailto:?subject=" + this.props.subject + "&body=" + this.props.contents} className="email">
        <i className="material-icons">email</i>
      </a>
    );
  }
});

// Share via Google+. Can only share link, no caption.
var ShareGoogle = React.createClass({
  getDefaultProps: function () {
    return {url: messageDefaults.url}
  },
  render: function () {
    return (
      <a href={'https://plus.google.com/share?url='+this.props.url} target="_blank" className="googleplus">
        <i className="fa fa-google-plus"></i>
      </a>
    );
  }
});

// Shares via facebook. Can only share link, no caption.
var ShareFacebook = React.createClass({
  getDefaultProps: function () {
    return {url: messageDefaults.url}
  },
  render: function () {
    return (
      <a href={'http://www.facebook.com/sharer/sharer.php?u='+this.props.url} target="_blank" className="facebook">
        <i className="fa fa-facebook"></i>
      </a>
    );
  }
});

// Shares via twitter.
var ShareTwitter = React.createClass({
  getDefaultProps: function () {
    return {contents: messageDefaults.contents}
  },

  getInitialState: function () {
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (iOS) {
      return {href: 'twitter://post?message='};
    } else {
      return {href: 'https://twitter.com/intent/tweet?text='};
    }
  },

  render: function () {
    return (
      <a href={this.state.href+this.props.contents} target="_blank" className="twitter">
        <i className="fa fa-twitter"></i>
      </a>
    );
  }
});

var ShareCard = React.createClass({
  getDefaultProps: function () {
    return {
      shareProps: messageDefaults
    }
  },

  render: function () {

    return (
      <div className='share-card'>
        <ShareSMS contents={this.props.shareProps.contents} />
        <ShareEmail contents={this.props.shareProps.contents} subject={this.props.shareProps.subject}/>
        <ShareGoogle url={this.props.shareProps.url} />
        <ShareFacebook url={this.props.shareProps.url} />
        <ShareTwitter contents={this.props.shareProps.contents} />
      </div>
    );
  }
});
