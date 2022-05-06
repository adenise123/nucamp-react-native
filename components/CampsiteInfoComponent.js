import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, Modal, Button, StyleSheet, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import { connect } from 'react-redux';
import { postFavorite, postComment } from '../redux/ActionCreators';
import { baseUrl } from '../shared/baseUrl';




const mapStateToProps = state => {
    return {
        campsites: state.campsites,
        comments: state.comments,
        favorites: state.favorites,
    };
};

const mapDispatchToProps = {
    postFavorite: campsiteId => postFavorite(campsiteId),
    postComment: (campsiteId, rating, author, text) => (postComment(campsiteId, rating, author, text))
};



function RenderCampsite(props) {

    const {campsite} = props;

    const view = React.createRef();//Linked to panResponder by ref(like an Id)//

    const recognizeDrag = ({dx}) => (dx < -200) ? true : false; //D=distance of a gesture across the 'x' axis.//

    const recognizeComment = ({dx}) => (dx > 200) ? true : false;


    const panResponder = PanResponder.create({//Created the PanResponder and gave create method an object that describes what kind of responder to create//
        onStartShouldSetPanResponder: () => true,//Activates PanResponder to respond to gestures on the component that it is used on//
        onPanResponderGrant: () => { //Handler that is triggered when a gesture is first recognized//
            view.current.rubberBand(1000) //View is the animatable component name//
            .then(endState => console.log(endState.finished ? 'finished' : 'canceled'));//Example that shows a log, can also be used to dispatch actions to a redux store, another animation or call an event handler//
        },
        onPanResponderEnd: (e, gestureState) => { //E = event.gestureState object holds info on the gesture that ended. Two automatic args. passed in//
            console.log('pan responder end', gestureState);
            if (recognizeDrag(gestureState)) { //recognizeDrag function with gestureState object passed to it//
                Alert.alert(
                    'Add Favorite',//Title Text//
                    'Are you sure you wish to add ' + campsite.name + ' to favorites?',//Body Text//
                    [
                        { //Array that holds objects to configure the alert button//
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => console.log('Cancel Pressed')
                        },
                        {//Second Button, checks if its already favorited, if not,calls markfavorite event handler//
                            text: 'OK',
                            onPress: () => props.favorite ?
                                console.log('Already set as a favorite') : props.markFavorite()
                        }
                    ],
                    { cancelable: false } //So that user does not click out of alert box to close it//
                );
            } else if (recognizeComment(gestureState)) {
                props.onShowModal();
            }

            
            return true;
        }
    });

    const shareCampsite = (title, message, url) => { //3 parameters with share function(takes up to 2 objects as args.)
        Share.share({
            title: title,//required arg.//
            message: `${title}: ${message} ${url}`,
            url: url
        },{ //optional arg.//
            dialogTitle: 'Share ' + title
        });
    };


    if (campsite) {
        return (
            <Animatable.View 
            animation='fadeInDown' 
            duration={2000} 
            delay={1000}
            ref={view}
            {...panResponder.panHandlers}//spread out panResponders panHandlers then recombined them into one object to pass as props into this component//
            >
                <Card 
                    featuredTitle={campsite.name}
                    image={{uri: baseUrl + campsite.image}}
                    >
                    
                    <Text style={{margin: 10}}>
                        {campsite.description}
                    </Text>

                    <View style={styles.cardRow}>
                        <Icon
                            name={props.favorite ? 'heart' : 'heart-o'} //using a ternary operator to check the status of favorite//
                            type='font-awesome' //Sets the library of icons you wish to use//
                            color='#f50'
                            raised
                            reverse //Reverses color scheme//
                            onPress={ () => props.favorite ? console.log('Already set as a favorite') : props.markFavorite()}
                        />
                        <Icon
                            name={'pencil'} //Pencil Icon//
                            type='font-awesome' //Sets the library of icons you wish to use//
                            color='#5637DD'
                            raised
                            reverse //Reverses color scheme//
                            onPress={ () => props.onShowModal() }
                        />
                        <Icon
                            name={'share'}
                            type='font-awesome'
                            color='#5637DD'
                            raised
                            reverse
                            onPress={() => shareCampsite(campsite.name, campsite.description, baseUrl + campsite.image)} 
                            //baseurl + img is the url from the server//
                        />
                    </View>
                </Card>
            </Animatable.View>

        );
    }
    return <View />;
}

function RenderComments ({comments}) {
    const renderCommentItem = ({item}) => {
        return (
            <View style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.text}</Text>
                <Rating 
                    readonly
                    startingValue={item.rating}
                    imageSize={10}
                    style={{alignItems:'flex-start', paddingVertical:'5%'}}
                />
                <Text style={{fontSize: 12}}>{`-- ${item.author}, ${item.date}`}</Text>
            </View>

        );
    }

    return (
        <Animatable.View animation='fadeInUp' duration={2000} delay={1000}>
            <Card title='Comments'>
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()} //Because all the comments have a unique ID, we can set this to use the ID//
                />
            </Card>
        </Animatable.View>

    );
}



class CampsiteInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            rating: 5,
            author:'',
            text: ''
        }

    }

    toggleModal() {
        this.setState({showModal: !this.state.showModal});
    }

    handleComment (campsiteId) {
        const { postComment } = this.props;
        const { rating, author, text } = this.state;
        postComment(campsiteId, rating, author, text);
        console.log(campsiteId);
        this.toggleModal();
    }


    //ResetForm function resets th state to the defaults//
    resetForm() {
        this.setState({
            rating: 5,
            author: '',
            text: '',
            showModal: false
        });
    }

    markFavorite(campsiteId) {
        this.props.postFavorite(campsiteId);
    };


    static navigationOptions = { //Configred title for the page.//
        title: 'Campsite Information'
    }


    render() {
        const campsiteId = this.props.navigation.getParam('campsiteId');//Receives the parameter, then Accesses the campsiteid passed thru the naviagtion prop that all screens have access to//
        const campsite = this.props.campsites.campsites.filter(campsite => campsite.id === campsiteId)[0];
        const comments = this.props.comments.comments.filter(comment => comment.campsiteId === campsiteId);
        return (
            <ScrollView>
                <RenderCampsite campsite={campsite} 
                    favorite={this.props.favorites.includes(campsiteId)}
                    markFavorite={() => this.markFavorite(campsiteId)}
                    onShowModal={() => this.toggleModal()}
                />

                <RenderComments comments={comments} />

                <Modal
                    animationType={'slide'}
                    transparent={false}
                    visible={this.state.showModal}
                    onRequestClose={() => this.toggleModal()} //Gets triggered if user uses hardware close btn on their device//
                >
                    <View style={styles.modal}>
                        <Rating
                            showRating
                            startingValue={this.rating}
                            imageSize={40}
                            onFinishRating={rating => this.setState({rating: rating})} 
                            style={{paddingVertical: 10}}
                        />
                        <Input 
                            label="Author"
                            placeholder='Author'
                            leftIcon={{type:'font-awesome', name:'user-o'}}
                            leftIconContainerStyle={{paddingRight: 10}}
                            onChangeText={author => this.setState({author: author})} //Takes Author as state//
                            value={this.state.author}
                        />
                        <Input
                            label="Comment" 
                            placeholder='Comment'
                            leftIcon={{type:'font-awesome', name:'comment-o'}}
                            leftIconContainerStyle={{paddingRight: 10}}
                            onChangeText={text => this.setState({text: text})} //Takes Author as state//
                            value={this.state.text}
                        />
                        <Button
                            onPress={() => {
                                this.handleComment(campsiteId);
                                this.resetForm();
                            }}
                            color='#5637DD'
                            title='Submit'
                        />




                        <View style={{margin:10}}>
                            <Button
                                onPress={() => {
                                    this.toggleModal();
                                    this.resetForm();
                                }}
                                color='#808080'
                                title='Cancel'
                            />
                        </View>
                    </View>
                </Modal>
            </ScrollView>

        );
    }
}

const styles = StyleSheet.create ({
    cardRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex:1,
        flexDirection: 'row',
        margin:20
    },
    modal: {
        justifyContent: 'center',
        margin:20
    },

})

export default connect(mapStateToProps, mapDispatchToProps)(CampsiteInfo);
