// Displays a message on the page.
var Toast = React.createClass({

  getInitialState: function () {
    return {
      showClass: ''        
    };
  },

  componentDidMount: function () {
    var context = this;
    //toast showing different messages for user interaction with buttons
    setTimeout(function() {
      context.setState({showClass: ' show'}); 
    }, 1);
    //toast having some delay before disapparing  
    setTimeout(function() {
      context.setState({showClass: ''});
    }, 4000);     
  },

  render: function () {
    if(this.props.message) {
      return (
        <div className={"toast error" + this.state.showClass}>{this.props.message}</div>
      );
    } else {
      return null;
    }
  }
});
