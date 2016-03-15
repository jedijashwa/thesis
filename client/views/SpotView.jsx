/** @jsx React.DOM */

var SpotView = React.createClass({
  getInitialState: function() {
      return {
          spot: {}
      };
  },

  componentDidMount: function() {
      this.getSpot();
  },

  getSpot: function() {
    console.log("spotView");
    var context = this;

    this.setState({loading: true});

    $.ajax({
      method: 'GET',
      //refactor to get correct spotId
      url: '/api/spot/1',
      dataType: 'json',
      success: function (data) {
        console.log("data: ", data);
        context.setState({spot: data});
        console.log("SUCCESS: ", context.state.spot);
        context.setState({loading: false});
        context.initMap();
      },
      error: function (error) {
        console.log("ERROR: ", error);
        context.setState({loading: false});
      }
    });
  },
  initMap: function() {

  },

  render: function() {
    console.log("Rendering SpotView");
    return (
      <div className="spot-container">
        <div className="create-map-view-container">
          <div id="create-map">Map will be here</div>
        </div>
        <div className='spot-view-container'>
          <div className="spot-name-container">
            <div className='category-icon-container'>
              <i className="fa fa-anchor"></i>
            </div>
            <span className='spot-name'>{this.state.spot.name}</span>
          </div>
          <h3>@{this.state.spot.start}</h3>
          <h4>created by: {this.state.spot.creator}</h4>
          <p>description: {this.state.spot.description}</p>
        </div>
      </div>
    );
  }

});
